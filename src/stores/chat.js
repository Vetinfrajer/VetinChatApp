import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'
import { io } from 'socket.io-client'
import { useAuthStore } from './auth'

export const useChatStore = defineStore('chat', () => {
  const socket = ref(null)
  const messages = ref([])
  const conversations = ref([])
  const activeConversation = ref(null)
  const onlineUsers = ref([])
  const loading = ref(false)
  const authStore = useAuthStore()

  const isConnected = computed(() => socket.value?.connected || false)

  const connectSocket = (token) => {
    socket.value = io('http://localhost:5001', {
      auth: { token }
    })

    socket.value.on('connect', () => {
      console.log('Připojeno k serveru')
    })

    socket.value.on('disconnect', () => {
      console.log('Odpojeno od serveru')
    })

    socket.value.on('message', (message) => {
      if (message.senderId !== authStore.user?.id) {
        addMessage(message)
      }
    })

    socket.value.on('userOnline', (userId) => {
      updateUserStatus(userId, true)
    })

    socket.value.on('userOffline', (userId) => {
      updateUserStatus(userId, false)
    })

    socket.value.on('typing', (data) => {
      // Implementace typing indikátoru
    })
  }

  const disconnectSocket = () => {
    if (socket.value) {
      socket.value.disconnect()
      socket.value = null
    }
  }

  const addMessage = (message) => {
    messages.value.push(message)
  }

  const sendMessage = (content, recipientId) => {
    if (!socket.value?.connected) return

    const message = {
      id: `local-${Date.now()}`,
      content,
      recipientId,
      senderId: authStore.user?.id,
      timestamp: new Date().toISOString()
    }

    addMessage(message)
    socket.value.emit('sendMessage', { content, recipientId })
  }

  const loadConversations = async () => {
    try {
      loading.value = true
      const response = await axios.get('/api/conversations')
      conversations.value = response.data
    } catch (error) {
      console.error('Chyba při načítání konverzací:', error)
    } finally {
      loading.value = false
    }
  }

  const loadMessages = async (conversationId) => {
    try {
      loading.value = true
      const response = await axios.get(`/api/conversations/${conversationId}/messages`)
      messages.value = response.data
      activeConversation.value = conversationId
    } catch (error) {
      console.error('Chyba při načítání zpráv:', error)
    } finally {
      loading.value = false
    }
  }

  const updateUserStatus = (userId, isOnline) => {
    const userIndex = onlineUsers.value.findIndex(user => user.id === userId)
    if (userIndex !== -1) {
      onlineUsers.value[userIndex].isOnline = isOnline
    }
  }

  const startTyping = (recipientId) => {
    if (socket.value?.connected) {
      socket.value.emit('typing', { recipientId, isTyping: true })
    }
  }

  const stopTyping = (recipientId) => {
    if (socket.value?.connected) {
      socket.value.emit('typing', { recipientId, isTyping: false })
    }
  }

  return {
    socket,
    messages,
    conversations,
    activeConversation,
    onlineUsers,
    loading,
    isConnected,
    connectSocket,
    disconnectSocket,
    sendMessage,
    loadConversations,
    loadMessages,
    startTyping,
    stopTyping
  }
}) 