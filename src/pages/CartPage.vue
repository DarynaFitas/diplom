<template>
  <section>
    <p class="eyebrow">Кошик</p>
    <h1 class="page-title">Ваші замовлення</h1>
    <p class="meta page-lead">
      Перевірте обрані моделі та оформіть замовлення. Доставка по Україні до 24 годин.
    </p>

    <div v-if="cartState.items.length" class="cart-grid">
      <div class="list cart-items">
        <article
          v-for="item in cartState.items"
          :key="item.id"
          class="card cart-row"
          v-reveal
        >
          <RouterLink :to="`/product/${item.id}`" class="cart-thumb">
            <img
              :src="item.image"
              :alt="item.name"
              width="160"
              height="120"
              loading="lazy"
              decoding="async"
            />
          </RouterLink>
          <div class="cart-info">
            <p class="eyebrow no-lines">{{ item.category }}</p>
            <RouterLink :to="`/product/${item.id}`" class="cart-item-title">
              <h3 class="no-margin">{{ item.name }}</h3>
            </RouterLink>
            <p class="hint">Бренд: {{ item.brand }} · Масштаб: {{ item.scale }}</p>
            <div class="cart-qty">
              <button
                type="button"
                class="qty-btn"
                aria-label="Зменшити кількість"
                @click="decrement(item.id)"
              >−</button>
              <span class="qty-value" :aria-label="`Кількість: ${item.quantity}`">{{ item.quantity }}</span>
              <button
                type="button"
                class="qty-btn"
                aria-label="Збільшити кількість"
                @click="increment(item.id)"
              >+</button>
            </div>
          </div>
          <div class="cart-price">
            <div class="price">{{ item.price * item.quantity }} грн</div>
            <button
              type="button"
              class="button-ghost btn-sm"
              @click="removeFromCart(item.id)"
            >Видалити</button>
          </div>
        </article>
      </div>

      <aside class="card cart-summary" v-reveal="{ delay: 100 }">
        <h3 class="no-margin">Підсумок</h3>
        <dl class="summary-list">
          <div class="summary-row">
            <dt>Товарів</dt>
            <dd>{{ totalItems }} шт.</dd>
          </div>
          <div class="summary-row">
            <dt>Сума</dt>
            <dd>{{ totalPrice }} грн</dd>
          </div>
          <div class="summary-row">
            <dt>Доставка</dt>
            <dd>Безкоштовно</dd>
          </div>
        </dl>
        <div class="cart-total">Разом: {{ totalPrice }} грн</div>

        <div v-if="!authState.user" class="login-hint cart-login-hint">
          Щоб оформити покупку, потрібно
          <RouterLink to="/auth">увійти або зареєструватися</RouterLink>.
        </div>

        <form v-else class="form checkout-form" @submit.prevent="handlePurchase">
          <h4 class="no-margin">Дані покупця</h4>
          <div class="field">
            <label class="field-label" for="cart-name">Імʼя</label>
            <input id="cart-name" :value="authState.user.name" type="text" disabled />
          </div>
          <div class="field">
            <label class="field-label" for="cart-email">Email</label>
            <input id="cart-email" :value="authState.user.email" type="email" disabled />
          </div>
          <div class="field">
            <label class="field-label" for="cart-phone">Телефон</label>
            <input id="cart-phone" :value="authState.user.phone" type="text" disabled />
          </div>

          <button type="submit" class="button-primary button-block" :disabled="submitting">
            {{ submitting ? 'Оформлення...' : 'Оформити замовлення' }}
          </button>
          <button type="button" class="button-ghost button-block" @click="clearCart">
            Очистити кошик
          </button>

          <p v-if="message" class="review-status">{{ message }}</p>
        </form>
      </aside>
    </div>

    <div v-else class="card empty-state cart-empty">
      <div class="cart-empty-mark" aria-hidden="true">♡</div>
      <h2>Кошик порожній</h2>
      <p class="meta">Оберіть модель з каталогу — і вона опиниться тут.</p>
      <RouterLink to="/" class="btn button-primary">Повернутися до каталогу</RouterLink>
    </div>
  </section>
</template>

<script setup>
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import {
  cartState,
  cartCount,
  cartTotal,
  clearCart,
  decrement,
  increment,
  removeFromCart,
} from '../stores/cartStore'
import { authState } from '../stores/authStore'
import { trackPurchase } from '../utils/analytics'
import { createOrder } from '../services'

const totalPrice = cartTotal
const totalItems = cartCount

const submitting = ref(false)
const message = ref('')

async function handlePurchase() {
  if (!cartState.items.length) return
  submitting.value = true
  message.value = ''
  try {
    await createOrder({ items: cartState.items })
    trackPurchase(cartState.items)
    message.value = 'Замовлення збережено в базі даних, а подію purchase відправлено в GA4.'
    clearCart()
  } catch (error) {
    message.value = `Помилка: ${error.message}`
  } finally {
    submitting.value = false
  }
}
</script>
