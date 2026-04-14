<template>
  <section class="auth-grid">
    <div class="card" v-reveal>
      <h1 class="page-title">Авторизація</h1>
      <p class="meta">Увійди у свій акаунт, щоб залишати відгуки й оформлювати замовлення.</p>
      <p class="meta">
        Для адміністратора: логін <strong>admin</strong> або
        <strong>admin@shop.local</strong>, пароль <strong>admin123</strong>.
      </p>

      <form class="form" @submit.prevent="handleLogin">
        <div class="field">
          <label class="field-label" for="login-email">Email або логін</label>
          <input
            id="login-email"
            v-model.trim="loginForm.email"
            type="text"
            autocomplete="username"
            placeholder="Email або логін"
            required
          />
        </div>
        <div class="field">
          <label class="field-label" for="login-password">Пароль</label>
          <input
            id="login-password"
            v-model="loginForm.password"
            type="password"
            autocomplete="current-password"
            placeholder="Пароль"
            required
          />
        </div>
        <button type="submit" class="button-primary" :disabled="submittingLogin">
          {{ submittingLogin ? 'Вхід...' : 'Увійти' }}
        </button>
        <p v-if="loginMessage" :class="loginError ? 'error-text' : 'success-text'">
          {{ loginMessage }}
        </p>
      </form>
    </div>

    <div class="card" v-reveal="{ delay: 80 }">
      <h2 class="page-title">Реєстрація</h2>
      <p class="meta">Створи акаунт: ім’я, email, номер телефону та пароль із валідацією.</p>

      <form class="form" @submit.prevent="handleRegister">
        <div class="field">
          <label class="field-label" for="reg-name">Ім’я</label>
          <input id="reg-name" v-model.trim="registerForm.name" type="text" autocomplete="name" placeholder="Ім’я" required />
        </div>
        <div class="field">
          <label class="field-label" for="reg-email">Email</label>
          <input id="reg-email" v-model.trim="registerForm.email" type="email" autocomplete="email" placeholder="Email" required />
        </div>
        <div class="field">
          <label class="field-label" for="reg-phone">Номер телефону</label>
          <input id="reg-phone" v-model.trim="registerForm.phone" type="tel" autocomplete="tel" placeholder="Номер телефону" required />
        </div>
        <div class="field">
          <label class="field-label" for="reg-password">Пароль</label>
          <input id="reg-password" v-model="registerForm.password" type="password" autocomplete="new-password" placeholder="Пароль" required />
        </div>
        <div class="field">
          <label class="field-label" for="reg-confirm">Підтвердь пароль</label>
          <input id="reg-confirm" v-model="registerForm.confirmPassword" type="password" autocomplete="new-password" placeholder="Підтвердь пароль" required />
        </div>
        <button type="submit" class="button-primary" :disabled="submittingRegister">
          {{ submittingRegister ? 'Реєстрація...' : 'Зареєструватися' }}
        </button>
        <p v-if="registerMessage" :class="registerError ? 'error-text' : 'success-text'">
          {{ registerMessage }}
        </p>
      </form>
    </div>
  </section>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { login, register } from '../stores/authStore'

const router = useRouter()

const loginForm = reactive({ email: '', password: '' })

const registerForm = reactive({
  name: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
})

const submittingLogin = ref(false)
const submittingRegister = ref(false)
const loginMessage = ref('')
const registerMessage = ref('')
const loginError = ref(false)
const registerError = ref(false)

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function validatePhone(phone) {
  return /^\+?[0-9\s()-]{10,18}$/.test(phone)
}

async function handleLogin() {
  loginMessage.value = ''
  loginError.value = false
  submittingLogin.value = true
  try {
    const data = await login(loginForm)
    loginMessage.value = 'Вхід успішний.'
    router.push(data.user?.role === 'admin' ? '/admin' : '/profile')
  } catch (error) {
    loginError.value = true
    loginMessage.value = error.message
  } finally {
    submittingLogin.value = false
  }
}

async function handleRegister() {
  registerMessage.value = ''
  registerError.value = false

  if (registerForm.name.trim().length < 2) {
    registerError.value = true
    registerMessage.value = 'Ім’я має містити щонайменше 2 символи.'
    return
  }
  if (!validateEmail(registerForm.email)) {
    registerError.value = true
    registerMessage.value = 'Введи коректну email адресу.'
    return
  }
  if (!validatePhone(registerForm.phone)) {
    registerError.value = true
    registerMessage.value = 'Введи коректний номер телефону.'
    return
  }
  if (registerForm.password.length < 6) {
    registerError.value = true
    registerMessage.value = 'Пароль має містити щонайменше 6 символів.'
    return
  }
  if (registerForm.password !== registerForm.confirmPassword) {
    registerError.value = true
    registerMessage.value = 'Паролі не збігаються.'
    return
  }

  submittingRegister.value = true
  try {
    await register(registerForm)
    registerMessage.value = 'Реєстрація успішна.'
    router.push('/profile')
  } catch (error) {
    registerError.value = true
    registerMessage.value = error.message
  } finally {
    submittingRegister.value = false
  }
}
</script>
