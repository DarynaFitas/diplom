<template>
  <section class="list">
    <article class="card">
      <h1 class="page-title">Адмін-панель</h1>
      <p class="meta">
        Тут адміністратор може керувати товарами, користувачами та відгуками.
      </p>

      <div class="tablist" role="tablist" aria-label="Розділи адмін-панелі">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          type="button"
          role="tab"
          class="tab"
          :aria-selected="activeTab === tab.key"
          :tabindex="activeTab === tab.key ? 0 : -1"
          @click="setTab(tab.key)"
        >
          {{ tab.label }}
        </button>
      </div>
    </article>

    <article v-if="message" class="card">
      <p :class="messageError ? 'error-text' : 'success-text'">{{ message }}</p>
    </article>

    <article v-if="activeTab === 'products'" class="card list">
      <div class="admin-header-row">
        <h2 class="no-margin">Товари</h2>
        <button type="button" class="button-primary" @click="startCreateProduct">Додати товар</button>
      </div>

      <form class="form" @submit.prevent="saveProduct">
        <div class="admin-grid-2">
          <div class="field">
            <label class="field-label" for="prod-name">Назва</label>
            <input id="prod-name" v-model.trim="productForm.name" type="text" placeholder="Назва товару" required />
          </div>
          <div class="field">
            <label class="field-label" for="prod-brand">Бренд</label>
            <input id="prod-brand" v-model.trim="productForm.brand" type="text" placeholder="Бренд" required />
          </div>
          <div class="field">
            <label class="field-label" for="prod-scale">Масштаб</label>
            <input id="prod-scale" v-model.trim="productForm.scale" type="text" placeholder="Масштаб" required />
          </div>
          <div class="field">
            <label class="field-label" for="prod-price">Ціна</label>
            <input id="prod-price" v-model.number="productForm.price" type="number" min="0" step="0.01" placeholder="Ціна" required />
          </div>
          <div class="field">
            <label class="field-label" for="prod-stock">Кількість</label>
            <input id="prod-stock" v-model.number="productForm.stock" type="number" min="0" step="1" placeholder="Кількість" required />
          </div>
        </div>

        <div class="list">
          <input
            ref="imageInput"
            type="file"
            accept="image/*"
            class="admin-hidden-file"
            aria-label="Завантажити зображення товару"
            @change="handleImageUpload"
          />
          <div class="actions">
            <button type="button" class="button-secondary" @click="openImagePicker">Додати зображення</button>
            <button v-if="productForm.image" type="button" class="button-secondary" @click="clearImage">Видалити зображення</button>
          </div>
          <p class="hint admin-picker-hint">Натисни кнопку, щоб вибрати фото з комп’ютера.</p>
          <p v-if="selectedImageName" class="meta">Обраний файл: {{ selectedImageName }}</p>
          <img
            v-if="productForm.image"
            :src="productForm.image"
            alt="Попередній перегляд зображення"
            class="admin-image-preview"
            width="520"
            height="390"
            loading="lazy"
            decoding="async"
          />
        </div>

        <div class="field">
          <label class="field-label" for="prod-desc">Опис товару</label>
          <textarea id="prod-desc" v-model="productForm.description" rows="4" placeholder="Опис товару"></textarea>
        </div>

        <div class="list">
          <div class="admin-header-row">
            <strong>Характеристики</strong>
            <button type="button" class="button-secondary" @click="addSpecification">Додати характеристику</button>
          </div>
          <div
            v-for="(spec, index) in productForm.specifications"
            :key="`spec-${index}`"
            class="admin-grid-spec"
          >
            <input v-model.trim="spec.name" type="text" :aria-label="`Назва характеристики ${index + 1}`" placeholder="Назва характеристики" />
            <input v-model.trim="spec.value" type="text" :aria-label="`Значення характеристики ${index + 1}`" placeholder="Значення" />
            <button type="button" class="button-secondary" @click="removeSpecification(index)">Видалити</button>
          </div>
        </div>

        <div class="actions">
          <button type="submit" class="button-primary" :disabled="loadingProducts">
            {{ productForm.id ? 'Зберегти зміни' : 'Створити товар' }}
          </button>
          <button type="button" class="button-secondary" @click="resetProductForm">Очистити</button>
        </div>
      </form>

      <p v-if="loadingProducts" class="meta">Завантаження товарів...</p>
      <div v-else class="list">
        <div v-for="product in products" :key="product.id" class="review-card">
          <div class="admin-header-row">
            <div>
              <strong>{{ product.name }}</strong>
              <div class="meta">{{ product.brand }} · {{ product.scale }} · {{ product.price }} грн</div>
              <div class="meta">На складі: {{ product.stock }}</div>
            </div>
            <div class="actions">
              <button type="button" class="button-secondary" @click="editProduct(product)">Редагувати</button>
              <button type="button" class="button-danger" @click="removeProduct(product.id)">Видалити</button>
            </div>
          </div>
        </div>
      </div>
    </article>

    <article v-else-if="activeTab === 'users'" class="card list">
      <h2 class="no-margin">Користувачі</h2>
      <p v-if="loadingUsers" class="meta">Завантаження користувачів...</p>
      <div v-else class="list">
        <form
          v-for="user in users"
          :key="user.id"
          class="review-card form"
          @submit.prevent="saveUser(user)"
        >
          <div class="admin-header-row">
            <strong>#{{ user.id }} — {{ user.name }}</strong>
            <button
              type="button"
              class="button-danger"
              :disabled="Number(user.id) === Number(authState.user?.id)"
              @click="removeUser(user.id)"
            >
              Видалити
            </button>
          </div>

          <div class="admin-grid-2">
            <div class="field">
              <label class="field-label" :for="`user-name-${user.id}`">Ім’я</label>
              <input :id="`user-name-${user.id}`" v-model.trim="user.name" type="text" placeholder="Ім’я" required />
            </div>
            <div class="field">
              <label class="field-label" :for="`user-email-${user.id}`">Email</label>
              <input :id="`user-email-${user.id}`" v-model.trim="user.email" type="email" placeholder="Email" required />
            </div>
            <div class="field">
              <label class="field-label" :for="`user-phone-${user.id}`">Телефон</label>
              <input :id="`user-phone-${user.id}`" v-model.trim="user.phone" type="tel" placeholder="Телефон" required />
            </div>
            <div class="field">
              <label class="field-label" :for="`user-role-${user.id}`">Роль</label>
              <select :id="`user-role-${user.id}`" v-model="user.role">
                <option value="user">Користувач</option>
                <option value="admin">Адмін</option>
              </select>
            </div>
          </div>
          <div class="field">
            <label class="field-label" :for="`user-pass-${user.id}`">Новий пароль (необов’язково)</label>
            <input :id="`user-pass-${user.id}`" v-model="user.newPassword" type="password" autocomplete="new-password" placeholder="Новий пароль (необов’язково)" />
          </div>
          <button type="submit" class="button-primary">Зберегти користувача</button>
        </form>
      </div>
    </article>

    <article v-else class="card list">
      <h2 class="no-margin">Відгуки</h2>
      <p v-if="loadingReviews" class="meta">Завантаження відгуків...</p>
      <div v-else class="list">
        <form
          v-for="review in reviews"
          :key="review.id"
          class="review-card form"
          @submit.prevent="saveReview(review)"
        >
          <div class="admin-header-row">
            <div>
              <strong>{{ review.product_name }}</strong>
              <div class="meta">Автор: {{ review.author }}</div>
            </div>
            <button type="button" class="button-danger" @click="removeReview(review.id)">Видалити</button>
          </div>

          <div class="field">
            <label class="field-label" :for="`review-rating-${review.id}`">Оцінка</label>
            <select :id="`review-rating-${review.id}`" v-model.number="review.rating">
              <option :value="5">5</option>
              <option :value="4">4</option>
              <option :value="3">3</option>
              <option :value="2">2</option>
              <option :value="1">1</option>
            </select>
          </div>
          <div class="field">
            <label class="field-label" :for="`review-comment-${review.id}`">Коментар</label>
            <textarea :id="`review-comment-${review.id}`" v-model="review.comment" rows="4" placeholder="Текст відгуку"></textarea>
          </div>
          <button type="submit" class="button-primary">Зберегти відгук</button>
        </form>
      </div>
    </article>
  </section>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import {
  createAdminProduct,
  deleteAdminProduct,
  deleteAdminReview,
  deleteAdminUser,
  fetchAdminProducts,
  fetchAdminReviews,
  fetchAdminUsers,
  updateAdminProduct,
  updateAdminReview,
  updateAdminUser,
} from '../services'
import { authState } from '../stores/authStore'

const tabs = [
  { key: 'products', label: 'Товари' },
  { key: 'users', label: 'Користувачі' },
  { key: 'reviews', label: 'Відгуки' },
]

const activeTab = ref('products')
const message = ref('')
const messageError = ref(false)

const loadingProducts = ref(false)
const loadingUsers = ref(false)
const loadingReviews = ref(false)

const products = ref([])
const users = ref([])
const reviews = ref([])
const imageInput = ref(null)
const selectedImageName = ref('')

const productForm = reactive(createEmptyProduct())

function createEmptyProduct() {
  return {
    id: null,
    name: '',
    brand: '',
    scale: '',
    price: 0,
    description: '',
    stock: 0,
    image: '',
    specifications: [{ name: '', value: '' }],
  }
}

function setMessage(text, isError = false) {
  message.value = text
  messageError.value = isError
}

function setTab(tabKey) {
  activeTab.value = tabKey
  setMessage('')
}

function resetProductForm() {
  Object.assign(productForm, createEmptyProduct())
  selectedImageName.value = ''
  if (imageInput.value) imageInput.value.value = ''
}

function startCreateProduct() {
  resetProductForm()
}

function openImagePicker() {
  imageInput.value?.click()
}

function clearImage() {
  productForm.image = ''
  selectedImageName.value = ''
  if (imageInput.value) imageInput.value.value = ''
}

function addSpecification() {
  productForm.specifications.push({ name: '', value: '' })
}

function removeSpecification(index) {
  productForm.specifications.splice(index, 1)
  if (!productForm.specifications.length) addSpecification()
}

function handleImageUpload(event) {
  const file = event.target.files?.[0]
  if (!file) return
  selectedImageName.value = file.name

  if (!file.type.startsWith('image/')) {
    setMessage('Потрібно вибрати саме файл зображення.', true)
    event.target.value = ''
    return
  }

  const reader = new FileReader()
  reader.onload = () => {
    productForm.image = String(reader.result || '')
    setMessage('Зображення додано.')
  }
  reader.onerror = () => {
    setMessage('Не вдалося прочитати файл зображення.', true)
  }
  reader.readAsDataURL(file)
  event.target.value = ''
}

function editProduct(product) {
  Object.assign(productForm, {
    id: product.id,
    name: product.name,
    brand: product.brand,
    scale: product.scale,
    price: product.price,
    description: product.description || '',
    stock: product.stock || 0,
    image: product.image || '',
    specifications: Array.isArray(product.specifications) && product.specifications.length
      ? product.specifications.map((spec) => ({ name: spec.name || '', value: spec.value || '' }))
      : [{ name: '', value: '' }],
  })
  activeTab.value = 'products'
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

async function loadProducts() {
  loadingProducts.value = true
  try {
    products.value = await fetchAdminProducts()
  } catch (error) {
    setMessage(error.message, true)
  } finally {
    loadingProducts.value = false
  }
}

async function loadUsers() {
  loadingUsers.value = true
  try {
    const data = await fetchAdminUsers()
    users.value = data.map((user) => ({ ...user, newPassword: '' }))
  } catch (error) {
    setMessage(error.message, true)
  } finally {
    loadingUsers.value = false
  }
}

async function loadReviews() {
  loadingReviews.value = true
  try {
    const data = await fetchAdminReviews()
    reviews.value = data.map((review) => ({ ...review, rating: Number(review.rating) }))
  } catch (error) {
    setMessage(error.message, true)
  } finally {
    loadingReviews.value = false
  }
}

async function saveProduct() {
  try {
    const payload = {
      ...productForm,
      specifications: productForm.specifications.filter((spec) => spec.name && spec.value),
    }

    if (productForm.id) {
      await updateAdminProduct(productForm.id, payload)
      setMessage('Товар оновлено.')
    } else {
      await createAdminProduct(payload)
      setMessage('Товар додано.')
    }

    resetProductForm()
    await loadProducts()
  } catch (error) {
    setMessage(error.message, true)
  }
}

async function removeProduct(id) {
  if (!window.confirm('Видалити товар?')) return
  try {
    await deleteAdminProduct(id)
    setMessage('Товар видалено.')
    if (productForm.id === id) resetProductForm()
    await loadProducts()
  } catch (error) {
    setMessage(error.message, true)
  }
}

async function saveUser(user) {
  try {
    await updateAdminUser(user.id, {
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      password: user.newPassword || undefined,
    })
    user.newPassword = ''
    setMessage('Користувача оновлено.')
    await loadUsers()
  } catch (error) {
    setMessage(error.message, true)
  }
}

async function removeUser(id) {
  if (!window.confirm('Видалити користувача?')) return
  try {
    await deleteAdminUser(id)
    setMessage('Користувача видалено.')
    await loadUsers()
  } catch (error) {
    setMessage(error.message, true)
  }
}

async function saveReview(review) {
  try {
    await updateAdminReview(review.id, {
      rating: review.rating,
      comment: review.comment,
    })
    setMessage('Відгук оновлено.')
    await loadReviews()
  } catch (error) {
    setMessage(error.message, true)
  }
}

async function removeReview(id) {
  if (!window.confirm('Видалити відгук?')) return
  try {
    await deleteAdminReview(id)
    setMessage('Відгук видалено.')
    await loadReviews()
  } catch (error) {
    setMessage(error.message, true)
  }
}

onMounted(async () => {
  await Promise.all([loadProducts(), loadUsers(), loadReviews()])
})
</script>
