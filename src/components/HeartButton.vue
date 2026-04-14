<template>
  <button
    type="button"
    class="heart-btn"
    :class="{ 'is-active': active }"
    :aria-label="active ? 'Видалити з обраного' : 'Додати в обране'"
    :aria-pressed="active"
    @click.stop.prevent="handleClick"
  >
    <svg viewBox="0 0 24 24" aria-hidden="true" class="heart-icon">
      <path
        d="M12 20.5 C12 20.5 4 15 4 9.5 C4 6.5 6.2 4.5 9 4.5 C10.6 4.5 11.6 5.3 12 6 C12.4 5.3 13.4 4.5 15 4.5 C17.8 4.5 20 6.5 20 9.5 C20 15 12 20.5 12 20.5Z"
        fill="currentColor"
        stroke="currentColor"
        stroke-width="1.6"
        stroke-linejoin="round"
      />
    </svg>
  </button>
</template>

<script setup>
import { computed } from 'vue'
import { isInWishlist, toggleWishlist } from '../stores/wishlistStore'

const props = defineProps({
  product: { type: Object, required: true },
})

const active = computed(() => isInWishlist(props.product.id))

function handleClick() {
  toggleWishlist(props.product)
}
</script>
