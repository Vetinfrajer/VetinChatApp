const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const sqlite3 = require('sqlite3').verbose();
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Database setup
const db = new sqlite3.Database('./chat.db');

// Create tables
db.serialize(() => {
  // Users table
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    bio TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Friends table
  db.run(`CREATE TABLE IF NOT EXISTS friends (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    friend_id TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id),
    FOREIGN KEY (friend_id) REFERENCES users (id)
  )`);

  // Messages table
  db.run(`CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    sender_id TEXT NOT NULL,
    recipient_id TEXT NOT NULL,
    content TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES users (id),
    FOREIGN KEY (recipient_id) REFERENCES users (id)
  )`);
});

// JWT secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Přístup zamítnut' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Neplatný token' });
    }
    req.user = user;
    next();
  });
};

// Socket authentication middleware
const authenticateSocket = (socket, next) => {
  const token = socket.handshake.auth.token;
  
  if (!token) {
    return next(new Error('Authentication error'));
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return next(new Error('Authentication error'));
    }
    socket.userId = user.id;
    next();
  });
};

io.use(authenticateSocket);

// Store online users
const onlineUsers = new Map();

// Socket connection handling
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.userId}`);
  onlineUsers.set(socket.userId, socket.id);

  // Notify others that user is online
  socket.broadcast.emit('userOnline', socket.userId);

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.userId}`);
    onlineUsers.delete(socket.userId);
    socket.broadcast.emit('userOffline', socket.userId);
  });

  socket.on('sendMessage', async (messageData) => {
    try {
      const messageId = uuidv4();
      const { content, recipientId } = messageData;
      
      // Save message to database
      db.run(
        'INSERT INTO messages (id, sender_id, recipient_id, content) VALUES (?, ?, ?, ?)',
        [messageId, socket.userId, recipientId, content],
        function(err) {
          if (err) {
            console.error('Error saving message:', err);
            return;
          }

          const message = {
            id: messageId,
            senderId: socket.userId,
            recipientId,
            content,
            timestamp: new Date().toISOString()
          };

          // Send to recipient if online
          const recipientSocketId = onlineUsers.get(recipientId);
          if (recipientSocketId) {
            io.to(recipientSocketId).emit('message', message);
          }
        }
      );
    } catch (error) {
      console.error('Error handling message:', error);
    }
  });

  socket.on('typing', (data) => {
    const recipientSocketId = onlineUsers.get(data.recipientId);
    if (recipientSocketId) {
      io.to(recipientSocketId).emit('typing', {
        userId: socket.userId,
        isTyping: data.isTyping
      });
    }
  });
});

// Auth routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Všechna pole jsou povinná' });
    }

    // Check if user already exists
    db.get('SELECT id FROM users WHERE email = ?', [email], async (err, row) => {
      if (err) {
        return res.status(500).json({ message: 'Databázová chyba' });
      }

      if (row) {
        return res.status(400).json({ message: 'Uživatel s tímto emailem již existuje' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);
      const userId = uuidv4();

      // Create user
      db.run(
        'INSERT INTO users (id, name, email, password) VALUES (?, ?, ?, ?)',
        [userId, name, email, hashedPassword],
        function(err) {
          if (err) {
            return res.status(500).json({ message: 'Chyba při vytváření uživatele' });
          }

          // Generate token
          const token = jwt.sign({ id: userId, email }, JWT_SECRET, { expiresIn: '7d' });

          res.json({
            user: { id: userId, name, email },
            token
          });
        }
      );
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email a heslo jsou povinné' });
    }

    db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
      if (err) {
        return res.status(500).json({ message: 'Databázová chyba' });
      }

      if (!user) {
        return res.status(400).json({ message: 'Neplatné přihlašovací údaje' });
      }

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(400).json({ message: 'Neplatné přihlašovací údaje' });
      }

      const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

      res.json({
        user: { id: user.id, name: user.name, email: user.email, bio: user.bio },
        token
      });
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Protected routes
app.get('/api/auth/profile', authenticateToken, (req, res) => {
  db.get('SELECT id, name, email, bio FROM users WHERE id = ?', [req.user.id], (err, user) => {
    if (err) {
      return res.status(500).json({ message: 'Databázová chyba' });
    }

    if (!user) {
      return res.status(404).json({ message: 'Uživatel nenalezen' });
    }

    res.json(user);
  });
});

app.put('/api/auth/profile', authenticateToken, (req, res) => {
  const { name, email, bio } = req.body;

  db.run(
    'UPDATE users SET name = ?, email = ?, bio = ? WHERE id = ?',
    [name, email, bio, req.user.id],
    function(err) {
      if (err) {
        return res.status(500).json({ message: 'Chyba při aktualizaci profilu' });
      }

      res.json({ id: req.user.id, name, email, bio });
    }
  );
});

app.get('/api/auth/stats', authenticateToken, (req, res) => {
  const userId = req.user.id;

  // Get friends count
  db.get('SELECT COUNT(*) as friends FROM friends WHERE user_id = ?', [userId], (err, friendsResult) => {
    if (err) {
      return res.status(500).json({ message: 'Databázová chyba' });
    }

    // Get messages count
    db.get('SELECT COUNT(*) as messages FROM messages WHERE sender_id = ? OR recipient_id = ?', [userId, userId], (err, messagesResult) => {
      if (err) {
        return res.status(500).json({ message: 'Databázová chyba' });
      }

      res.json({
        friends: friendsResult.friends,
        messages: messagesResult.messages
      });
    });
  });
});

// Users routes
app.get('/api/users', authenticateToken, (req, res) => {
  db.all('SELECT id, name, email, bio FROM users WHERE id != ?', [req.user.id], (err, users) => {
    if (err) {
      return res.status(500).json({ message: 'Databázová chyba' });
    }

    // Add online status
    const usersWithStatus = users.map(user => ({
      ...user,
      isOnline: onlineUsers.has(user.id)
    }));

    res.json(usersWithStatus);
  });
});

// Friends routes
app.get('/api/friends', authenticateToken, (req, res) => {
  db.all(`
    SELECT u.id, u.name, u.email, u.bio 
    FROM users u 
    INNER JOIN friends f ON u.id = f.friend_id 
    WHERE f.user_id = ?
  `, [req.user.id], (err, friends) => {
    if (err) {
      return res.status(500).json({ message: 'Databázová chyba' });
    }

    const friendsWithStatus = friends.map(friend => ({
      ...friend,
      isOnline: onlineUsers.has(friend.id)
    }));

    res.json(friendsWithStatus);
  });
});

app.post('/api/friends', authenticateToken, (req, res) => {
  const { userId } = req.body;
  const friendId = uuidv4();

  db.run(
    'INSERT INTO friends (id, user_id, friend_id) VALUES (?, ?, ?)',
    [friendId, req.user.id, userId],
    function(err) {
      if (err) {
        return res.status(500).json({ message: 'Chyba při přidávání přítele' });
      }

      res.json({ message: 'Přítel přidán' });
    }
  );
});

// Conversations routes
app.get('/api/conversations', authenticateToken, (req, res) => {
  const userId = req.user.id;

  db.all(`
    SELECT 
      f.friend_id as id,
      u.id as participant_id,
      u.name as participant_name,
      u.email as participant_email,
      m.content as last_message,
      m.timestamp as last_message_time,
      (SELECT COUNT(*) FROM messages WHERE sender_id = u.id AND recipient_id = ? AND id NOT IN (
        SELECT id FROM messages WHERE sender_id = ? AND recipient_id = u.id
      )) as unread_count
    FROM friends f
    INNER JOIN users u ON f.friend_id = u.id
    LEFT JOIN messages m ON (
      (m.sender_id = f.user_id AND m.recipient_id = f.friend_id) OR
      (m.sender_id = f.friend_id AND m.recipient_id = f.user_id)
    )
    WHERE f.user_id = ?
    GROUP BY f.friend_id
    ORDER BY m.timestamp DESC
  `, [userId, userId, userId], (err, conversations) => {
    if (err) {
      return res.status(500).json({ message: 'Databázová chyba' });
    }

    const conversationsWithParticipant = conversations.map(conv => ({
      id: conv.id,
      participant: {
        id: conv.participant_id,
        name: conv.participant_name,
        email: conv.participant_email,
        isOnline: onlineUsers.has(conv.participant_id)
      },
      lastMessage: conv.last_message ? {
        content: conv.last_message,
        timestamp: conv.last_message_time
      } : null,
      unreadCount: conv.unread_count || 0
    }));

    res.json(conversationsWithParticipant);
  });
});

app.get('/api/conversations/:conversationId/messages', authenticateToken, (req, res) => {
  const { conversationId } = req.params;
  const userId = req.user.id;

  // Verify that conversationId is a friend
  db.get('SELECT id FROM friends WHERE user_id = ? AND friend_id = ?', [userId, conversationId], (err, friend) => {
    if (err || !friend) {
      return res.status(404).json({ message: 'Konverzace nenalezena' });
    }

    db.all(`
      SELECT id, sender_id, recipient_id, content, timestamp
      FROM messages 
      WHERE (sender_id = ? AND recipient_id = ?) OR (sender_id = ? AND recipient_id = ?)
      ORDER BY timestamp ASC
    `, [userId, conversationId, conversationId, userId], (err, messages) => {
      if (err) {
        return res.status(500).json({ message: 'Databázová chyba' });
      }

      res.json(messages);
    });
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server běží na portu ${PORT}`);
}); 