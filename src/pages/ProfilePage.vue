<template>
  <section v-if="!authState.user" class="card empty-state">
    <h1 class="page-title">Особистий кабінет</h1>
    <p class="meta">Щоб переглянути кабінет, увійди або зареєструйся.</p>
    <RouterLink to="/auth" class="btn button-primary">Перейти до входу</RouterLink>
  </section>

  <section v-else class="list">
    <article class="card" v-reveal>
      <h1 class="page-title">Особистий кабінет</h1>
      <div class="profile-grid">
        <div>
          <p><strong>Ім’я:</strong> {{ authState.user.name }}</p>
          <p><strong>Email:</strong> {{ authState.user.email }}</p>
          <p><strong>Телефон:</strong> {{ authState.user.phone }}</p>
          <p>
            <strong>Роль:</strong>
            {{ authState.user.role === 'admin' ? 'Адміністратор' : 'Користувач' }}
          </p>
        </div>
        <div class="profile-note">
          Тут зберігаються твої дані акаунта та історія замовлень.
          <p v-if="authState.user.role === 'admin'" class="profile-admin-link">
            <RouterLink to="/admin">Перейти в адмін-панель</RouterLink>
          </p>
        </div>
      </div>
    </article>

    <article class="card" v-reveal="{ delay: 80 }">
      <h2 class="page-title">Мої замовлення</h2>
      <p v-if="loading" class="meta">Завантаження замовлень...</p>
      <p v-else-if="message" class="meta">{{ message }}</p>

      <div v-else-if="orders.length" class="list">
        <div v-for="order in orders" :key="order.id" class="review-card">
          <div class="review-head">
            <strong>Замовлення #{{ order.id }}</strong>
            <span>{{ order.status }}</span>
          </div>
          <p class="meta">Сума: {{ order.totalAmount }} грн</p>
          <p class="meta">Дата: {{ formatDate(order.createdAt) }}</p>
          <ul class="order-items">
            <li v-for="item in order.items" :key="`${order.id}-${item.name}`">
              {{ item.name }} — {{ item.quantity }} шт. × {{ item.price }} грн
            </li>
          </ul>
        </div>
      </div>
      <p v-else class="meta">Поки що замовлень немає.</p>
    </article>
  </section>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { fetchMyOrders } from '../services'
import { authState } from '../stores/authStore'

const orders = ref([])
const loading = ref(false)
const message = ref('')

function formatDate(value) {
  return new Date(value).toLocaleString('uk-UA')
}

onMounted(async () => {
  if (!authState.user) return
  loading.value = true
  try {
    orders.value = await fetchMyOrders()
  } catch (error) {
    message.value = error.message
  } finally {
    loading.value = false
  }
})
</script>
