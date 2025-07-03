<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <header class="bg-white shadow-sm border-b border-gray-200">
      <div class="flex items-center justify-between px-6 py-4">
        <div class="flex items-center space-x-4">
          <router-link to="/chat" class="text-primary-600 hover:text-primary-700">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
            </svg>
          </router-link>
          <h1 class="text-2xl font-bold text-gray-900">Uživatelé</h1>
        </div>
      </div>
    </header>

    <div class="max-w-4xl mx-auto py-8 px-6">
      <!-- Search -->
      <div class="mb-8">
        <div class="relative">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Hledat uživatele..."
            class="input-field pl-10"
          />
          <svg class="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
          </svg>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="text-center py-8">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
        <p class="mt-4 text-gray-600">Načítání uživatelů...</p>
      </div>

      <!-- Users grid -->
      <div v-else-if="filteredUsers.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          v-for="user in filteredUsers"
          :key="user.id"
          class="card hover:shadow-lg transition-shadow"
        >
          <div class="flex items-center space-x-4">
            <div class="w-12 h-12 bg-primary-500 rounded-full flex items-center justify-center text-white font-semibold text-lg">
              {{ user.name.charAt(0).toUpperCase() }}
            </div>
            <div class="flex-1">
              <h3 class="text-lg font-medium text-gray-900">{{ user.name }}</h3>
              <p class="text-sm text-gray-500">{{ user.email }}</p>
              <div class="flex items-center space-x-2 mt-1">
                <div class="w-2 h-2 rounded-full" :class="user.isOnline ? 'bg-green-500' : 'bg-gray-400'"></div>
                <span class="text-xs text-gray-500">{{ user.isOnline ? 'Online' : 'Offline' }}</span>
              </div>
            </div>
          </div>
          
          <div class="mt-4 flex space-x-2">
            <button
              v-if="!isFriend(user.id)"
              @click="addFriend(user.id)"
              :disabled="addingFriend === user.id"
              class="btn-primary flex-1 flex justify-center items-center disabled:opacity-50"
            >
              <span v-if="addingFriend === user.id" class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
              {{ addingFriend === user.id ? 'Přidávání...' : 'Přidat přítele' }}
            </button>
            <button
              v-else
              @click="startChat(user.id)"
              class="btn-secondary flex-1"
            >
              Začít chat
            </button>
          </div>
        </div>
      </div>

      <!-- No users -->
      <div v-else class="text-center py-8">
        <div class="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"></path>
          </svg>
        </div>
        <h3 class="text-lg font-medium text-gray-900 mb-2">Žádní uživatelé</h3>
        <p class="text-gray-500">
          {{ searchQuery ? 'Nebyli nalezeni žádní uživatelé odpovídající vyhledávání' : 'Zatím nejsou žádní uživatelé k dispozici' }}
        </p>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

export default {
  name: 'Users',
  setup() {
    const router = useRouter()
    
    const users = ref([])
    const friends = ref([])
    const loading = ref(false)
    const addingFriend = ref(null)
    const searchQuery = ref('')
    
    const filteredUsers = computed(() => {
      if (!searchQuery.value) return users.value
      
      const query = searchQuery.value.toLowerCase()
      return users.value.filter(user => 
        user.name.toLowerCase().includes(query) || 
        user.email.toLowerCase().includes(query)
      )
    })
    
    const loadUsers = async () => {
      try {
        loading.value = true
        const [usersResponse, friendsResponse] = await Promise.all([
          axios.get('/api/users'),
          axios.get('/api/friends')
        ])
        
        users.value = usersResponse.data
        friends.value = friendsResponse.data
      } catch (error) {
        console.error('Chyba při načítání uživatelů:', error)
      } finally {
        loading.value = false
      }
    }
    
    const addFriend = async (userId) => {
      try {
        addingFriend.value = userId
        await axios.post('/api/friends', { userId })
        await loadUsers() // Reload to update friend status
      } catch (error) {
        console.error('Chyba při přidávání přítele:', error)
      } finally {
        addingFriend.value = null
      }
    }
    
    const startChat = (userId) => {
      // Navigate to chat with this user
      router.push(`/chat?user=${userId}`)
    }
    
    const isFriend = (userId) => {
      return friends.value.some(friend => friend.id === userId)
    }
    
    onMounted(() => {
      loadUsers()
    })
    
    return {
      users,
      friends,
      loading,
      addingFriend,
      searchQuery,
      filteredUsers,
      addFriend,
      startChat,
      isFriend
    }
  }
}
</script> 