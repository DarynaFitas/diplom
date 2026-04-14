<template>
  <section v-if="loading" class="card" aria-busy="true">Завантаження товару...</section>

  <section v-else-if="product" class="product-layout">
    <div class="product-image" v-reveal>
      <div class="product-image-frame">
        <img
          :src="product.image"
          :alt="product.name"
          width="1200"
          height="900"
          loading="lazy"
          decoding="async"
        />
      </div>
    </div>

    <div class="card" v-reveal="{ delay: 80 }">
      <p class="eyebrow">{{ product.category }}</p>
      <h1 class="page-title">{{ product.name }}</h1>
      <div class="price price-lg">{{ product.price }} грн</div>
      <p class="meta">
        В наявності: <strong>{{ product.stock }} шт.</strong>
        <span v-if="product.stock <= 3 && product.stock > 0" class="hint-strong"> · Лімітований залишок</span>
      </p>

      <div class="actions admin-actions-top">
        <button type="button" class="button-primary" @click="handleAddToCart">
          Додати в кошик
        </button>
        <RouterLink to="/cart" class="btn button-secondary">
          Перейти в кошик
        </RouterLink>
        <HeartButton :product="product" class="product-page-heart" />
      </div>

      <div class="tabs">
        <div
          class="tablist"
          role="tablist"
          aria-label="Деталі товару"
          @keydown="handleTabKey"
        >
          <button
            v-for="(tab, index) in tabs"
            :key="tab.key"
            :id="`tab-${tab.key}`"
            :ref="(el) => setTabRef(el, index)"
            type="button"
            role="tab"
            class="tab"
            :aria-selected="activeTab === tab.key"
            :aria-controls="`panel-${tab.key}`"
            :tabindex="activeTab === tab.key ? 0 : -1"
            @click="activeTab = tab.key"
          >
            {{ tab.label }}
          </button>
        </div>

        <div
          v-show="activeTab === 'description'"
          :id="`panel-description`"
          role="tabpanel"
          class="tab-panel"
          aria-labelledby="tab-description"
          :tabindex="0"
          :hidden="activeTab !== 'description'"
        >
          <p>{{ product.description }}</p>
        </div>

        <div
          v-show="activeTab === 'specifications'"
          :id="`panel-specifications`"
          role="tabpanel"
          class="tab-panel"
          aria-labelledby="tab-specifications"
          :tabindex="0"
          :hidden="activeTab !== 'specifications'"
        >
          <div class="spec-list">
            <div v-for="(value, key) in product.specifications" :key="key" class="spec-row">
              <strong>{{ key }}</strong>
              <span>{{ value }}</span>
            </div>
          </div>
        </div>

        <div
          v-show="activeTab === 'reviews'"
          :id="`panel-reviews`"
          role="tabpanel"
          class="tab-panel"
          aria-labelledby="tab-reviews"
          :tabindex="0"
          :hidden="activeTab !== 'reviews'"
        >
          <div v-if="product.reviews.length" class="review-list">
            <article v-for="review in product.reviews" :key="review.id" class="review-card">
              <div class="review-head">
                <strong>{{ review.author }}</strong>
                <span class="stars" :aria-label="`Оцінка: ${review.rating} з 5`">
                  {{ '★'.repeat(review.rating) }}{{ '☆'.repeat(5 - review.rating) }}
                </span>
              </div>
              <p>{{ review.comment }}</p>
            </article>
          </div>
          <p v-else class="meta">Поки що немає відгуків.</p>

          <div v-if="!authState.user" class="login-hint">
            Щоб залишити відгук, потрібно <RouterLink to="/auth">увійти в акаунт</RouterLink>.
          </div>

          <form v-else class="form" @submit.prevent="submitReview">
            <h3>Залишити відгук</h3>
            <p class="meta">
              Відгук буде опублікований від імені:
              <strong>{{ authState.user.name }}</strong>
            </p>
            <div class="field">
              <label class="field-label" for="review-rating">Оцінка</label>
              <select id="review-rating" v-model.number="reviewForm.rating" required>
                <option :value="5">5 — Чудово</option>
                <option :value="4">4 — Добре</option>
                <option :value="3">3 — Задовільно</option>
                <option :value="2">2 — Погано</option>
                <option :value="1">1 — Жахливо</option>
              </select>
            </div>
            <div class="field">
              <label class="field-label" for="review-comment">Ваш відгук</label>
              <textarea
                id="review-comment"
                v-model="reviewForm.comment"
                rows="4"
                placeholder="Розкажіть про модель..."
                required
              ></textarea>
            </div>
            <button type="submit" class="button-primary" :disabled="submitting">
              {{ submitting ? 'Надсилання...' : 'Надіслати відгук' }}
            </button>
            <p v-if="reviewMessage" class="review-status">{{ reviewMessage }}</p>
          </form>
        </div>
      </div>
    </div>
  </section>

  <section v-else class="empty-state card">
    <h2>Товар не знайдено</h2>
    <p class="meta" v-if="error">{{ error }}</p>
    <RouterLink to="/" class="btn button-primary">На головну</RouterLink>
  </section>
</template>

<script setup>
import { onMounted, ref, watch, nextTick } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { addToCart } from '../stores/cartStore'
import { authState } from '../stores/authStore'
import { trackAddToCart, trackViewItem } from '../utils/analytics'
import { fetchProductById, createReview } from '../services'
import HeartButton from '../components/HeartButton.vue'

const route = useRoute()
const product = ref(null)
const loading = ref(true)
const error = ref('')
const reviewMessage = ref('')
const submitting = ref(false)
const reviewForm = ref({ rating: 5, comment: '' })

const tabs = [
  { key: 'description', label: 'Опис' },
  { key: 'specifications', label: 'Характеристики' },
  { key: 'reviews', label: 'Відгуки' },
]
const activeTab = ref('description')
const tabRefs = []

function setTabRef(el, index) {
  if (el) tabRefs[index] = el
}

function handleTabKey(event) {
  const currentIndex = tabs.findIndex((t) => t.key === activeTab.value)
  if (currentIndex === -1) return
  let next = currentIndex
  if (event.key === 'ArrowRight') next = (currentIndex + 1) % tabs.length
  else if (event.key === 'ArrowLeft') next = (currentIndex - 1 + tabs.length) % tabs.length
  else if (event.key === 'Home') next = 0
  else if (event.key === 'End') next = tabs.length - 1
  else return
  event.preventDefault()
  activeTab.value = tabs[next].key
  nextTick(() => tabRefs[next]?.focus())
}

async function loadProduct() {
  loading.value = true
  error.value = ''
  reviewMessage.value = ''
  try {
    product.value = await fetchProductById(route.params.id)
    trackViewItem(product.value)
  } catch (err) {
    product.value = null
    error.value = err.message
  } finally {
    loading.value = false
  }
}

onMounted(loadProduct)
watch(() => route.params.id, loadProduct)

function handleAddToCart() {
  if (!product.value) return
  addToCart(product.value)
  trackAddToCart(product.value)
}

async function submitReview() {
  if (!product.value) return
  submitting.value = true
  reviewMessage.value = ''
  try {
    await createReview(product.value.id, reviewForm.value)
    reviewMessage.value = 'Відгук успішно додано.'
    reviewForm.value = { rating: 5, comment: '' }
    await loadProduct()
    activeTab.value = 'reviews'
  } catch (err) {
    reviewMessage.value = `Помилка: ${err.message}`
  } finally {
    submitting.value = false
  }
}
</script>
