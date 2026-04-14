import { API_BASE_URL } from './config'

// API_BASE_URL includes the `/api` suffix, so the origin is everything before it.
const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '')

function resolveImageUrl(value) {
  if (!value) return value
  if (typeof value !== 'string') return value
  if (/^(https?:|data:)/i.test(value)) return value
  if (value.startsWith('/api/')) return `${API_ORIGIN}${value}`
  return value
}

function decorateProduct(product) {
  if (!product || typeof product !== 'object') return product
  if (product.image) product.image = resolveImageUrl(product.image)
  return product
}

function getAuthToken() {
  return localStorage.getItem('auth_token') || ''
}

async function handleResponse(response) {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Помилка запиту' }))
    throw new Error(error.message || 'Помилка запиту')
  }

  return response.json()
}

async function apiFetch(path, options = {}) {
  const headers = {
    ...(options.headers || {}),
  }

  const token = getAuthToken()
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  })

  return handleResponse(response)
}

export async function fetchProducts() {
  const list = await apiFetch('/products')
  return Array.isArray(list) ? list.map(decorateProduct) : list
}

export async function fetchProductById(id) {
  return decorateProduct(await apiFetch(`/products/${id}`))
}

export async function createReview(productId, payload) {
  return apiFetch(`/products/${productId}/reviews`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
}

export async function createOrder(payload) {
  return apiFetch('/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
}

export async function registerUser(payload) {
  return apiFetch('/auth/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
}

export async function loginUser(payload) {
  return apiFetch('/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
}

export async function fetchCurrentUser() {
  return apiFetch('/auth/me')
}

export async function fetchMyOrders() {
  return apiFetch('/my/orders')
}

export async function fetchAdminUsers() {
  return apiFetch('/admin/users')
}

export async function updateAdminUser(id, payload) {
  return apiFetch(`/admin/users/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

export async function deleteAdminUser(id) {
  return apiFetch(`/admin/users/${id}`, {
    method: 'DELETE',
  })
}

export async function fetchAdminProducts() {
  const list = await apiFetch('/admin/products')
  return Array.isArray(list) ? list.map(decorateProduct) : list
}

export async function createAdminProduct(payload) {
  return apiFetch('/admin/products', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

export async function updateAdminProduct(id, payload) {
  return apiFetch(`/admin/products/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

export async function deleteAdminProduct(id) {
  return apiFetch(`/admin/products/${id}`, {
    method: 'DELETE',
  })
}

export async function fetchAdminReviews() {
  return apiFetch('/admin/reviews')
}

export async function updateAdminReview(id, payload) {
  return apiFetch(`/admin/reviews/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

export async function deleteAdminReview(id) {
  return apiFetch(`/admin/reviews/${id}`, {
    method: 'DELETE',
  })
}
