# VetinChat - Messenger Aplikace

Moderní real-time messenger aplikace postavená na Vue.js a Express.js s Socket.io.

## Funkce

- ✅ Registrace a přihlášení uživatelů
- ✅ Real-time chat s přáteli
- ✅ Seznam uživatelů a přidávání přátel
- ✅ Profil uživatele s možností editace
- ✅ Online/offline status
- ✅ Moderní a responzivní UI
- ✅ Bezpečná autentifikace s JWT

## Technologie

### Frontend
- Vue.js 3 (Composition API)
- Vue Router pro navigaci
- Pinia pro state management
- Tailwind CSS pro styling
- Socket.io-client pro real-time komunikaci
- Axios pro HTTP požadavky

### Backend
- Express.js
- Socket.io pro real-time komunikaci
- SQLite databáze
- JWT autentifikace
- bcryptjs pro hashování hesel

## Instalace a spuštění

### 1. Instalace závislostí

```bash
# Frontend závislosti
npm install

# Backend závislosti
cd server
npm install
```

### 2. Spuštění backend serveru

```bash
cd server
npm run dev
```

Server bude běžet na `http://localhost:5000`

### 3. Spuštění frontend aplikace

```bash
npm run dev
```

Aplikace bude dostupná na `http://localhost:3000`

## Struktura projektu

```
VetinChatApp/
├── src/
│   ├── views/           # Stránky aplikace
│   │   ├── Login.vue
│   │   ├── Register.vue
│   │   ├── Chat.vue
│   │   ├── Users.vue
│   │   └── Profile.vue
│   ├── stores/          # Pinia stores
│   │   ├── auth.js
│   │   └── chat.js
│   ├── router/          # Vue Router
│   │   └── index.js
│   ├── App.vue
│   ├── main.js
│   └── style.css
├── server/              # Backend
│   ├── server.js
│   └── package.json
├── package.json
├── vite.config.js
└── README.md
```

## API Endpoints

### Autentifikace
- `POST /api/auth/register` - Registrace uživatele
- `POST /api/auth/login` - Přihlášení uživatele
- `GET /api/auth/profile` - Získání profilu
- `PUT /api/auth/profile` - Aktualizace profilu
- `GET /api/auth/stats` - Statistiky uživatele

### Uživatelé a přátelé
- `GET /api/users` - Seznam všech uživatelů
- `GET /api/friends` - Seznam přátel
- `POST /api/friends` - Přidání přítele

### Chat
- `GET /api/conversations` - Seznam konverzací
- `GET /api/conversations/:id/messages` - Zprávy v konverzaci

## Socket.io Events

### Client → Server
- `sendMessage` - Odeslání zprávy
- `typing` - Indikace psaní

### Server → Client
- `message` - Nová zpráva
- `userOnline` - Uživatel je online
- `userOffline` - Uživatel je offline
- `typing` - Uživatel píše

## Vývoj

Pro vývoj doporučuji spustit oba servery současně:

1. Backend: `cd server && npm run dev`
2. Frontend: `npm run dev`

## Databáze

Aplikace používá SQLite databázi, která se automaticky vytvoří při prvním spuštění serveru. Databáze obsahuje tabulky:

- `users` - Uživatelé
- `friends` - Přátelství
- `messages` - Zprávy

## Bezpečnost

- Hesla jsou hashována pomocí bcryptjs
- JWT tokeny pro autentifikaci
- CORS nastavení pro bezpečnou komunikaci
- Validace vstupů na serveru

## Licence

MIT 
