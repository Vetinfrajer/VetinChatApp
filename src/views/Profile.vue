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
          <h1 class="text-2xl font-bold text-gray-900">Můj profil</h1>
        </div>
      </div>
    </header>

    <div class="max-w-2xl mx-auto py-8 px-6">
      <div class="card">
        <div class="text-center mb-8">
          <div class="w-24 h-24 bg-primary-500 rounded-full flex items-center justify-center text-white font-semibold text-3xl mx-auto mb-4">
            {{ user?.name?.charAt(0).toUpperCase() }}
          </div>
          <h2 class="text-2xl font-bold text-gray-900">{{ user?.name }}</h2>
          <p class="text-gray-600">{{ user?.email }}</p>
        </div>

        <form @submit.prevent="handleUpdateProfile" class="space-y-6">
          <div>
            <label for="name" class="block text-sm font-medium text-gray-700 mb-2">
              Jméno
            </label>
            <input
              id="name"
              v-model="form.name"
              type="text"
              required
              class="input-field"
              placeholder="Vaše jméno"
            />
          </div>

          <div>
            <label for="email" class="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              id="email"
              v-model="form.email"
              type="email"
              required
              class="input-field"
              placeholder="vas@email.cz"
            />
          </div>

          <div>
            <label for="bio" class="block text-sm font-medium text-gray-700 mb-2">
              Bio (volitelné)
            </label>
            <textarea
              id="bio"
              v-model="form.bio"
              rows="3"
              class="input-field resize-none"
              placeholder="Něco o sobě..."
            ></textarea>
          </div>

          <div v-if="error" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {{ error }}
          </div>

          <div v-if="success" class="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            {{ success }}
          </div>

          <button
            type="submit"
            :disabled="loading"
            class="btn-primary w-full flex justify-center items-center"
          >
            <span v-if="loading" class="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></span>
            {{ loading ? 'Ukládání...' : 'Uložit změny' }}
          </button>
        </form>

        <div class="mt-8 pt-8 border-t border-gray-200">
          <h3 class="text-lg font-medium text-gray-900 mb-4">Statistiky</h3>
          <div class="grid grid-cols-2 gap-4">
            <div class="bg-gray-50 rounded-lg p-4 text-center">
              <div class="text-2xl font-bold text-primary-600">{{ stats.friends || 0 }}</div>
              <div class="text-sm text-gray-600">Přátelé</div>
            </div>
            <div class="bg-gray-50 rounded-lg p-4 text-center">
              <div class="text-2xl font-bold text-primary-600">{{ stats.messages || 0 }}</div>
              <div class="text-sm text-gray-600">Zprávy</div>
            </div>
          </div>
        </div>

        <div class="mt-8 pt-8 border-t border-gray-200">
          <h3 class="text-lg font-medium text-gray-900 mb-4">Nastavení účtu</h3>
          <div class="space-y-4">
            <button
              @click="showChangePassword = true"
              class="btn-secondary w-full"
            >
              Změnit heslo
            </button>
            <button
              @click="handleDeleteAccount"
              class="bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-lg transition-colors w-full"
            >
              Smazat účet
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Change Password Modal -->
    <div v-if="showChangePassword" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-lg max-w-md w-full p-6">
        <h3 class="text-lg font-medium text-gray-900 mb-4">Změnit heslo</h3>
        
        <form @submit.prevent="handleChangePassword" class="space-y-4">
          <div>
            <label for="currentPassword" class="block text-sm font-medium text-gray-700 mb-2">
              Současné heslo
            </label>
            <input
              id="currentPassword"
              v-model="passwordForm.currentPassword"
              type="password"
              required
              class="input-field"
            />
          </div>

          <div>
            <label for="newPassword" class="block text-sm font-medium text-gray-700 mb-2">
              Nové heslo
            </label>
            <input
              id="newPassword"
              v-model="passwordForm.newPassword"
              type="password"
              required
              class="input-field"
              minlength="6"
            />
          </div>

          <div>
            <label for="confirmNewPassword" class="block text-sm font-medium text-gray-700 mb-2">
              Potvrďte nové heslo
            </label>
            <input
              id="confirmNewPassword"
              v-model="passwordForm.confirmNewPassword"
              type="password"
              required
              class="input-field"
            />
          </div>

          <div v-if="passwordError" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {{ passwordError }}
          </div>

          <div class="flex space-x-3">
            <button
              type="button"
              @click="showChangePassword = false"
              class="btn-secondary flex-1"
            >
              Zrušit
            </button>
            <button
              type="submit"
              :disabled="passwordLoading"
              class="btn-primary flex-1"
            >
              {{ passwordLoading ? 'Změna...' : 'Změnit heslo' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import axios from 'axios'

export default {
  name: 'Profile',
  setup() {
    const router = useRouter()
    const authStore = useAuthStore()
    
    const user = computed(() => authStore.user)
    const stats = ref({ friends: 0, messages: 0 })
    const loading = ref(false)
    const error = ref('')
    const success = ref('')
    
    const form = reactive({
      name: '',
      email: '',
      bio: ''
    })
    
    const showChangePassword = ref(false)
    const passwordLoading = ref(false)
    const passwordError = ref('')
    
    const passwordForm = reactive({
      currentPassword: '',
      newPassword: '',
      confirmNewPassword: ''
    })
    
    const loadProfile = async () => {
      try {
        const response = await axios.get('/api/auth/profile')
        const profile = response.data
        
        form.name = profile.name || ''
        form.email = profile.email || ''
        form.bio = profile.bio || ''
        
        // Load stats
        const statsResponse = await axios.get('/api/auth/stats')
        stats.value = statsResponse.data
      } catch (error) {
        console.error('Chyba při načítání profilu:', error)
      }
    }
    
    const handleUpdateProfile = async () => {
      try {
        loading.value = true
        error.value = ''
        success.value = ''
        
        const result = await authStore.updateProfile(form)
        
        if (result.success) {
          success.value = 'Profil byl úspěšně aktualizován'
        } else {
          error.value = result.error
        }
      } catch (err) {
        error.value = 'Chyba při aktualizaci profilu'
      } finally {
        loading.value = false
      }
    }
    
    const handleChangePassword = async () => {
      if (passwordForm.newPassword !== passwordForm.confirmNewPassword) {
        passwordError.value = 'Hesla se neshodují'
        return
      }
      
      if (passwordForm.newPassword.length < 6) {
        passwordError.value = 'Heslo musí mít alespoň 6 znaků'
        return
      }
      
      try {
        passwordLoading.value = true
        passwordError.value = ''
        
        await axios.put('/api/auth/password', {
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        })
        
        showChangePassword.value = false
        passwordForm.currentPassword = ''
        passwordForm.newPassword = ''
        passwordForm.confirmNewPassword = ''
        
        success.value = 'Heslo bylo úspěšně změněno'
      } catch (err) {
        passwordError.value = err.response?.data?.message || 'Chyba při změně hesla'
      } finally {
        passwordLoading.value = false
      }
    }
    
    const handleDeleteAccount = async () => {
      if (!confirm('Opravdu chcete smazat svůj účet? Tato akce je nevratná.')) {
        return
      }
      
      try {
        await axios.delete('/api/auth/account')
        authStore.logout()
        router.push('/')
      } catch (error) {
        console.error('Chyba při mazání účtu:', error)
      }
    }
    
    onMounted(() => {
      loadProfile()
    })
    
    return {
      user,
      stats,
      form,
      loading,
      error,
      success,
      showChangePassword,
      passwordForm,
      passwordLoading,
      passwordError,
      handleUpdateProfile,
      handleChangePassword,
      handleDeleteAccount
    }
  }
}
</script> 