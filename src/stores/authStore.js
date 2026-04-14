import { computed, reactive } from 'vue'
import { fetchCurrentUser, loginUser, registerUser } from '../services'

const savedToken = localStorage.getItem('auth_token') || ''
const savedUser = localStorage.getItem('auth_user')

export const authState = reactive({
  token: savedToken,
  user: savedUser ? JSON.parse(savedUser) : null,
  loading: false,
})

export const isAuthenticated = computed(() => Boolean(authState.token && authState.user))

function persistSession(token, user) {
  authState.token = token
  authState.user = user
  localStorage.setItem('auth_token', token)
  localStorage.setItem('auth_user', JSON.stringify(user))
}

export async function register(payload) {
  authState.loading = true
  try {
    const data = await registerUser(payload)
    persistSession(data.token, data.user)
    return data
  } finally {
    authState.loading = false
  }
}

export async function login(payload) {
  authState.loading = true
  try {
    const data = await loginUser(payload)
    persistSession(data.token, data.user)
    return data
  } finally {
    authState.loading = false
  }
}

export async function loadCurrentUser() {
  if (!authState.token) return null

  try {
    const user = await fetchCurrentUser()
    authState.user = user
    localStorage.setItem('auth_user', JSON.stringify(user))
    return user
  } catch (error) {
    logout()
    throw error
  }
}

export function logout() {
  authState.token = ''
  authState.user = null
  localStorage.removeItem('auth_token')
  localStorage.removeItem('auth_user')
}
