<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-blue-100">
    <div class="max-w-md w-full space-y-8">
      <div class="text-center">
        <h1 class="text-4xl font-bold text-gray-900 mb-2">VetinChat</h1>
        <p class="text-gray-600">Vytvořte si nový účet</p>
      </div>
      
      <div class="card">
        <form @submit.prevent="handleRegister" class="space-y-6">
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
            <label for="password" class="block text-sm font-medium text-gray-700 mb-2">
              Heslo
            </label>
            <input
              id="password"
              v-model="form.password"
              type="password"
              required
              class="input-field"
              placeholder="Minimálně 6 znaků"
              minlength="6"
            />
          </div>
          
          <div>
            <label for="confirmPassword" class="block text-sm font-medium text-gray-700 mb-2">
              Potvrďte heslo
            </label>
            <input
              id="confirmPassword"
              v-model="form.confirmPassword"
              type="password"
              required
              class="input-field"
              placeholder="Zopakujte heslo"
            />
          </div>
          
          <div v-if="error" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {{ error }}
          </div>
          
          <button
            type="submit"
            :disabled="loading || !isFormValid"
            class="btn-primary w-full flex justify-center items-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span v-if="loading" class="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></span>
            {{ loading ? 'Registrace...' : 'Zaregistrovat se' }}
          </button>
        </form>
        
        <div class="mt-6 text-center">
          <p class="text-gray-600">
            Už máte účet?
            <router-link to="/" class="text-primary-600 hover:text-primary-700 font-medium">
              Přihlaste se
            </router-link>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

export default {
  name: 'Register',
  setup() {
    const router = useRouter()
    const authStore = useAuthStore()
    
    const form = reactive({
      name: '',
      email: '',
      password: '',
      confirmPassword: ''
    })
    
    const loading = ref(false)
    const error = ref('')
    
    const isFormValid = computed(() => {
      return form.name && 
             form.email && 
             form.password && 
             form.confirmPassword && 
             form.password === form.confirmPassword &&
             form.password.length >= 6
    })
    
    const handleRegister = async () => {
      if (!isFormValid.value) {
        error.value = 'Prosím vyplňte všechny pole správně'
        return
      }
      
      loading.value = true
      error.value = ''
      
      const result = await authStore.register({
        name: form.name,
        email: form.email,
        password: form.password
      })
      
      if (result.success) {
        router.push('/chat')
      } else {
        error.value = result.error
      }
      
      loading.value = false
    }
    
    return {
      form,
      loading,
      error,
      isFormValid,
      handleRegister
    }
  }
}
</script> 