import { reactive, computed, watch } from 'vue'

const STORAGE_KEY = 'rose_cart'

function readInitial() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export const cartState = reactive({
  items: readInitial(),
})

watch(
  () => cartState.items,
  (items) => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)) } catch { /* ignore */ }
  },
  { deep: true }
)

export const cartCount = computed(() =>
  cartState.items.reduce((sum, item) => sum + Number(item.quantity || 0), 0)
)

export const cartTotal = computed(() =>
  cartState.items.reduce((sum, item) => sum + Number(item.price) * Number(item.quantity || 0), 0)
)

export function addToCart(product, quantity = 1) {
  if (!product?.id) return
  const existing = cartState.items.find((item) => Number(item.id) === Number(product.id))
  if (existing) {
    existing.quantity = Number(existing.quantity || 0) + Number(quantity)
  } else {
    cartState.items.push({
      id: product.id,
      name: product.name,
      brand: product.brand,
      scale: product.scale,
      price: product.price,
      image: product.image,
      category: product.category,
      quantity,
    })
  }
}

export function increment(id) {
  const item = cartState.items.find((x) => Number(x.id) === Number(id))
  if (item) item.quantity = Number(item.quantity || 0) + 1
}

export function decrement(id) {
  const item = cartState.items.find((x) => Number(x.id) === Number(id))
  if (!item) return
  const next = Number(item.quantity || 0) - 1
  if (next <= 0) removeFromCart(id)
  else item.quantity = next
}

export function removeFromCart(id) {
  const i = cartState.items.findIndex((x) => Number(x.id) === Number(id))
  if (i >= 0) cartState.items.splice(i, 1)
}

export function clearCart() {
  cartState.items.splice(0, cartState.items.length)
}
