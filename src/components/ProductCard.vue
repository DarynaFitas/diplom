<template>
  <article class="card product-card card-hover" v-reveal>
    <div class="product-card-media">
      <span class="product-card-badge">{{ product.category }}</span>
      <span v-if="isNew" class="product-card-ribbon">NEW</span>
      <HeartButton :product="product" class="product-card-heart" />
      <img
        :src="product.image"
        :alt="product.name"
        width="640"
        height="480"
        loading="lazy"
        decoding="async"
      />
      <div class="product-card-overlay" aria-hidden="true"></div>
    </div>
    <div class="product-card-body">
      <h3 class="product-card-title">{{ product.name }}</h3>
      <p class="product-card-desc">{{ product.description }}</p>
      <div class="product-card-footer">
        <div class="price">{{ product.price }} грн</div>
        <div class="actions">
          <button type="button" class="button-primary btn-sm" @click="quickAdd">
            У кошик
          </button>
          <button type="button" class="product-card-open" @click="openSpotlight">
            Переглянути
          </button>
        </div>
      </div>
    </div>
  </article>
</template>

<script setup>
import { computed } from 'vue'
import HeartButton from './HeartButton.vue'
import { addToCart } from '../stores/cartStore'
import { trackAddToCart } from '../utils/analytics'

const props = defineProps({
  product: { type: Object, required: true },
})

const emit = defineEmits(['open'])

// Treat products created within the last 30 days as NEW, or fall back to id-based heuristic.
const isNew = computed(() => {
  if (props.product.createdAt) {
    const t = new Date(props.product.createdAt).getTime()
    return Date.now() - t < 1000 * 60 * 60 * 24 * 30
  }
  return Number(props.product.id) > 4
})

function openSpotlight() { emit('open') }

function quickAdd() {
  addToCart(props.product)
  trackAddToCart(props.product)
}
</script>
