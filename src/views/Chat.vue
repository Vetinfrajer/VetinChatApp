<template>
  <div class="h-screen flex flex-col bg-gray-50">
    <!-- Header -->
    <header class="bg-white shadow-sm border-b border-gray-200">
      <div class="flex items-center justify-between px-6 py-4">
        <div class="flex items-center space-x-4">
          <h1 class="text-2xl font-bold text-gray-900">VetinChat</h1>
          <div class="flex items-center space-x-2">
            <div class="w-2 h-2 rounded-full" :class="isConnected ? 'bg-green-500' : 'bg-red-500'"></div>
            <span class="text-sm text-gray-600">{{ isConnected ? 'Online' : 'Offline' }}</span>
          </div>
        </div>
        
        <div class="flex items-center space-x-4">
          <router-link to="/users" class="btn-secondary">
            Uživatelé
          </router-link>
          <router-link to="/profile" class="btn-secondary">
            Profil
          </router-link>
          <button @click="handleLogout" class="btn-secondary">
            Odhlásit
          </button>
        </div>
      </div>
    </header>

    <div class="flex-1 flex overflow-hidden">
      <!-- Sidebar s konverzacemi -->
      <div class="w-80 bg-white border-r border-gray-200 flex flex-col">
        <div class="p-4 border-b border-gray-200">
          <h2 class="text-lg font-semibold text-gray-900">Konverzace</h2>
        </div>
        
        <div class="flex-1 overflow-y-auto">
          <div v-if="loading" class="p-4 text-center text-gray-500">
            Načítání...
          </div>
          
          <div v-else-if="conversations.length === 0" class="p-4 text-center text-gray-500">
            Žádné konverzace
          </div>
          
          <div v-else class="divide-y divide-gray-200">
            <div
              v-for="conversation in conversations"
              :key="conversation.id"
              @click="selectConversation(conversation)"
              class="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
              :class="{ 'bg-primary-50': activeConversation === conversation.id }"
            >
              <div class="flex items-center space-x-3">
                <div class="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center text-white font-semibold">
                  {{ conversation.participant.name.charAt(0).toUpperCase() }}
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-gray-900 truncate">
                    {{ conversation.participant.name }}
                  </p>
                  <p class="text-xs text-gray-500 truncate">
                    {{ conversation.lastMessage?.content || 'Žádné zprávy' }}
                  </p>
                </div>
                <div class="flex flex-col items-end space-y-1">
                  <span class="text-xs text-gray-400">
                    {{ formatTime(conversation.lastMessage?.timestamp) }}
                  </span>
                  <div v-if="conversation.unreadCount > 0" class="w-5 h-5 bg-primary-500 rounded-full flex items-center justify-center">
                    <span class="text-xs text-white">{{ conversation.unreadCount }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Chat area -->
      <div class="flex-1 flex flex-col">
        <div v-if="!selectedConversation" class="flex-1 flex items-center justify-center">
          <div class="text-center">
            <div class="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
              </svg>
            </div>
            <h3 class="text-lg font-medium text-gray-900 mb-2">Vyberte konverzaci</h3>
            <p class="text-gray-500">Začněte chatovat s přáteli</p>
          </div>
        </div>

        <div v-else class="flex-1 flex flex-col">
          <!-- Chat header -->
          <div class="bg-white border-b border-gray-200 px-6 py-4">
            <div class="flex items-center space-x-3">
              <div class="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center text-white font-semibold">
                {{ selectedConversation.participant.name.charAt(0).toUpperCase() }}
              </div>
              <div>
                <h3 class="text-lg font-medium text-gray-900">
                  {{ selectedConversation.participant.name }}
                </h3>
                <p class="text-sm text-gray-500">
                  {{ selectedConversation.participant.isOnline ? 'Online' : 'Offline' }}
                </p>
              </div>
            </div>
          </div>

          <!-- Messages -->
          <div class="flex-1 overflow-y-auto p-6 space-y-4">
            <div v-if="loading" class="text-center text-gray-500">
              Načítání zpráv...
            </div>
            
            <div v-else-if="messages.length === 0" class="text-center text-gray-500">
              Žádné zprávy
            </div>
            
            <div v-else>
              <div
                v-for="message in messages"
                :key="message.id"
                class="flex"
                :class="message.senderId === currentUser?.id ? 'justify-end' : 'justify-start'"
              >
                <div
                  class="max-w-xs lg:max-w-md px-4 py-2 rounded-lg"
                  :class="message.senderId === currentUser?.id 
                    ? 'bg-primary-500 text-white' 
                    : 'bg-gray-200 text-gray-900'"
                >
                  <p class="text-sm">{{ message.content }}</p>
                  <p class="text-xs mt-1 opacity-70">
                    {{ formatTime(message.timestamp) }}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Message input -->
          <div class="bg-white border-t border-gray-200 p-4">
            <form @submit.prevent="sendMessage" class="flex space-x-4">
              <input
                v-model="newMessage"
                type="text"
                placeholder="Napište zprávu..."
                class="flex-1 input-field"
                @input="handleTyping"
                @blur="stopTyping"
              />
              <button
                type="submit"
                :disabled="!newMessage.trim()"
                class="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Odeslat
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useChatStore } from '../stores/chat'

export default {
  name: 'Chat',
  setup() {
    const router = useRouter()
    const authStore = useAuthStore()
    const chatStore = useChatStore()
    
    const newMessage = ref('')
    const selectedConversation = ref(null)
    
    const currentUser = computed(() => authStore.user)
    const conversations = computed(() => chatStore.conversations)
    const messages = computed(() => chatStore.messages)
    const activeConversation = computed(() => chatStore.activeConversation)
    const loading = computed(() => chatStore.loading)
    const isConnected = computed(() => chatStore.isConnected)
    
    onMounted(async () => {
      if (!authStore.user && authStore.token) {
        await authStore.loadProfile()
      }
      if (authStore.token) {
        chatStore.connectSocket(authStore.token)
        await chatStore.loadConversations()
      }
    })
    
    onUnmounted(() => {
      chatStore.disconnectSocket()
    })
    
    const selectConversation = async (conversation) => {
      selectedConversation.value = conversation
      if (!authStore.user && authStore.token) {
        await authStore.loadProfile()
      }
      await chatStore.loadMessages(conversation.id)
    }
    
    const sendMessage = () => {
      if (!newMessage.value.trim() || !selectedConversation.value) return
      
      chatStore.sendMessage(newMessage.value, selectedConversation.value.participant.id)
      newMessage.value = ''
    }
    
    const handleTyping = () => {
      if (selectedConversation.value) {
        chatStore.startTyping(selectedConversation.value.participant.id)
      }
    }
    
    const stopTyping = () => {
      if (selectedConversation.value) {
        chatStore.stopTyping(selectedConversation.value.participant.id)
      }
    }
    
    const handleLogout = () => {
      authStore.logout()
      router.push('/')
    }
    
    const formatTime = (timestamp) => {
      if (!timestamp) return ''
      const date = new Date(timestamp)
      return date.toLocaleTimeString('cs-CZ', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    }
    
    return {
      newMessage,
      selectedConversation,
      currentUser,
      conversations,
      messages,
      activeConversation,
      loading,
      isConnected,
      selectConversation,
      sendMessage,
      handleTyping,
      stopTyping,
      handleLogout,
      formatTime
    }
  }
}
</script> 