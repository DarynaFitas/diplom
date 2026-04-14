<template>
  <section>
    <div class="hero" ref="heroRef">
      <div class="hero-inner">
        <div class="hero-text">
          <p class="eyebrow hero-eyebrow">Rosé Garage · Сезон {{ year }}</p>
          <h1 class="hero-title">
            Кутюрний бутик <em>колекційних моделей авто</em>
          </h1>
          <p class="hero-lead">
            Обмежені серії, деталізовані репліки й фірмова атмосфера рожевого couture.
            Справжній подарунок для поціновувачок і поціновувачів витонченого стилю.
          </p>
          <div class="actions">
            <a href="#catalog" class="btn button-primary">
              Перейти до каталогу
              <span aria-hidden="true">→</span>
            </a>
            <button type="button" class="btn button-secondary" @click="openNewsletter">
              Підписка на новинки
            </button>
          </div>
          <div class="hero-stats">
            <div class="stat">
              <div class="stat-value">12</div>
              <div class="stat-label">брендів у бутику</div>
            </div>
            <div class="stat">
              <div class="stat-value">{{ products.length || '—' }}</div>
              <div class="stat-label">моделей у каталозі</div>
            </div>
            <div class="stat">
              <div class="stat-value">24 год</div>
              <div class="stat-label">доставка по Україні</div>
            </div>
          </div>
        </div>
        <div class="hero-visual" aria-hidden="true">
          <div class="hero-orb"></div>
          <div class="hero-ring"></div>
        </div>
      </div>
    </div>

    <div class="brand-strip" aria-label="Бренди у бутику">
      <span>Porsche</span>
      <span>BMW</span>
      <span>Mercedes</span>
      <span>Lexus</span>
      <span>Volkswagen</span>
      <span>Skoda</span>
      <span>Audi</span>
      <span>Ferrari</span>
    </div>

    <div class="section-head section-head-catalog" id="catalog">
      <div>
        <p class="eyebrow">Каталог</p>
        <h2 class="page-title no-margin">Обрані колекційні моделі</h2>
      </div>
      <div class="toolbar">
        <label class="toolbar-search">
          <span class="visually-hidden">Пошук моделі</span>
          <svg viewBox="0 0 24 24" aria-hidden="true" class="icon">
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-3.5-3.5" />
          </svg>
          <input
            id="catalog-search"
            name="catalog-search"
            v-model.trim="query"
            type="search"
            placeholder="Пошук моделі, бренду, масштабу..."
          />
        </label>
        <label class="toolbar-sort">
          <span class="visually-hidden">Сортування</span>
          <select id="catalog-sort" name="catalog-sort" v-model="sort">
            <option value="default">За замовчуванням</option>
            <option value="price-asc">Ціна: спочатку менша</option>
            <option value="price-desc">Ціна: спочатку вища</option>
            <option value="name">За назвою</option>
          </select>
        </label>
      </div>
    </div>

    <div v-if="brandOptions.length" class="chips" role="group" aria-label="Фільтр за брендом">
      <button
        type="button"
        class="chip"
        :class="{ 'is-active': brand === null }"
        @click="brand = null"
      >Усі бренди</button>
      <button
        v-for="name in brandOptions"
        :key="name"
        type="button"
        class="chip"
        :class="{ 'is-active': brand === name }"
        @click="brand = name"
      >{{ name }}</button>
    </div>

    <div v-if="loading" class="card">Завантаження товарів...</div>
    <div v-else-if="error" class="card empty-state">{{ error }}</div>

    <div v-else-if="filtered.length" class="grid grid-catalog">
      <ProductCard
        v-for="product in filtered"
        :key="product.id"
        :product="product"
        @open="openSpotlight(product)"
      />
    </div>
    <div v-else class="card empty-state">
      <p class="meta">Нічого не знайдено. Спробуйте інший запит або скиньте фільтр.</p>
      <button type="button" class="btn button-secondary" @click="resetFilters">Скинути фільтр</button>
    </div>

    <Teleport to="body">
      <ProductSpotlight
        v-if="spotlightProduct"
        :product="spotlightProduct"
        @close="spotlightProduct = null"
      />
    </Teleport>
  </section>
</template>

<script setup>
import { computed, onMounted, onBeforeUnmount, ref } from 'vue'
import ProductCard from '../components/ProductCard.vue'
import ProductSpotlight from '../components/ProductSpotlight.vue'
import { fetchProducts } from '../services'
import { openNewsletter } from '../utils/newsletter'

const year = new Date().getFullYear()
const products = ref([])
const loading = ref(true)
const error = ref('')
const spotlightProduct = ref(null)

const query = ref('')
const sort = ref('default')
const brand = ref(null)

const heroRef = ref(null)
let scrollBound = false

function openSpotlight(product) {
  spotlightProduct.value = product
}

const brandOptions = computed(() => {
  const set = new Set(products.value.map((p) => p.brand).filter(Boolean))
  return Array.from(set).sort()
})

const filtered = computed(() => {
  let list = products.value.slice()
  if (brand.value) list = list.filter((p) => p.brand === brand.value)
  if (query.value) {
    const q = query.value.toLowerCase()
    list = list.filter((p) =>
      [p.name, p.brand, p.scale, p.description].filter(Boolean).some((s) => String(s).toLowerCase().includes(q))
    )
  }
  switch (sort.value) {
    case 'price-asc':  list.sort((a, b) => Number(a.price) - Number(b.price)); break
    case 'price-desc': list.sort((a, b) => Number(b.price) - Number(a.price)); break
    case 'name':       list.sort((a, b) => String(a.name).localeCompare(String(b.name), 'uk')); break
    default:           /* keep server order */ break
  }
  return list
})

function resetFilters() {
  query.value = ''
  sort.value = 'default'
  brand.value = null
}

function handleParallax() {
  if (!heroRef.value) return
  const y = Math.min(window.scrollY || 0, 420)
  heroRef.value.style.setProperty('--py', `${y * 0.08}px`)
}

onMounted(async () => {
  try {
    products.value = await fetchProducts()
  } catch (err) {
    error.value = `Не вдалося завантажити товари: ${err.message}`
  } finally {
    loading.value = false
  }

  const prefersReduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  if (!prefersReduced) {
    window.addEventListener('scroll', handleParallax, { passive: true })
    scrollBound = true
  }
})

onBeforeUnmount(() => {
  if (scrollBound) window.removeEventListener('scroll', handleParallax)
})
</script>
