import { reactive, computed, watch } from 'vue'

const STORAGE_KEY = 'rose_wishlist'

function readInitial() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export const wishlistState = reactive({
  items: readInitial(),
  open: false,
})

watch(
  () => wishlistState.items,
  (items) => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)) } catch { /* ignore */ }
  },
  { deep: true }
)

export const wishlistCount = computed(() => wishlistState.items.length)

export function isInWishlist(id) {
  return wishlistState.items.some((item) => Number(item.id) === Number(id))
}

export function toggleWishlist(product) {
  if (!product?.id) return
  const i = wishlistState.items.findIndex((x) => Number(x.id) === Number(product.id))
  if (i >= 0) {
    wishlistState.items.splice(i, 1)
  } else {
    wishlistState.items.push({
      id: product.id,
      name: product.name,
      brand: product.brand,
      scale: product.scale,
      price: product.price,
      image: product.image,
      category: product.category,
    })
  }
}

export function removeFromWishlist(id) {
  const i = wishlistState.items.findIndex((x) => Number(x.id) === Number(id))
  if (i >= 0) wishlistState.items.splice(i, 1)
}

export function openWishlist() { wishlistState.open = true }
export function closeWishlist() { wishlistState.open = false }
