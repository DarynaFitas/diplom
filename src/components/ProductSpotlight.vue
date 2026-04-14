<template>
  <div
    class="spotlight"
    role="dialog"
    aria-modal="true"
    :aria-labelledby="titleId"
    @click.self="close"
    @keydown.esc="close"
  >
    <button
      type="button"
      class="spotlight-close"
      aria-label="Закрити спотлайт"
      @click="close"
    >
      ✕
    </button>

    <div class="spotlight-media" aria-hidden="true">
      <img
        :src="product.image"
        :alt="product.name"
        width="1200"
        height="900"
        loading="eager"
        decoding="async"
      />
      <div class="spotlight-shimmer"></div>
    </div>

    <div class="spotlight-panel">
      <p class="eyebrow spotlight-eyebrow">{{ product.category }}</p>
      <h2 :id="titleId" class="spotlight-title">{{ product.name }}</h2>
      <p class="spotlight-desc">{{ product.description }}</p>

      <div v-if="specEntries.length" class="spotlight-specs">
        <div v-for="[name, value] in specEntries" :key="name" class="spec-row">
          <strong>{{ name }}</strong>
          <span>{{ value }}</span>
        </div>
      </div>

      <div class="price price-lg">{{ product.price }} грн</div>

      <div class="actions actions-gap-4">
        <RouterLink :to="`/product/${product.id}`" class="btn button-secondary" @click="close">
          Деталі товару
        </RouterLink>
      </div>

      <div class="spotlight-dock">
        <span class="dock-confirm" :class="{ 'is-pulsing': pulsing }"></span>
        <button
          ref="dockBtn"
          type="button"
          class="button-primary"
          :disabled="pulsing"
          @click="handleAddToCart"
        >
          {{ pulsing ? 'Додано' : 'Додати в кошик' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onBeforeUnmount, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { addToCart } from '../stores/cartStore'
import { trackAddToCart } from '../utils/analytics'
import { fetchProductById } from '../services'

const props = defineProps({
  product: { type: Object, required: true },
})
const emit = defineEmits(['close'])

const titleId = `spotlight-title-${props.product.id}`
const pulsing = ref(false)
const dockBtn = ref(null)
const detail = ref(null)

async function loadDetail() {
  try {
    detail.value = await fetchProductById(props.product.id)
  } catch {
    detail.value = null
  }
}

watch(() => props.product?.id, loadDetail, { immediate: true })

const specEntries = computed(() => {
  const s = detail.value?.specifications || props.product.specifications
  if (!s) return []
  if (Array.isArray(s)) return s.filter((x) => x.name).map((x) => [x.name, x.value])
  return Object.entries(s)
})

function close() {
  emit('close')
}

function handleAddToCart() {
  addToCart(props.product)
  trackAddToCart(props.product)
  pulsing.value = true
  setTimeout(() => { pulsing.value = false }, 700)
}

function onKey(event) {
  if (event.key === 'Escape') close()
}

onMounted(() => {
  document.body.style.overflow = 'hidden'
  window.addEventListener('keydown', onKey)
  dockBtn.value?.focus()
})

onBeforeUnmount(() => {
  document.body.style.overflow = ''
  window.removeEventListener('keydown', onKey)
})
</script>
