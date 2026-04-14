<template>
  <div class="app-shell">
    <div class="top-ticker" aria-hidden="true">
      <div class="top-ticker-track">
        <span>Безкоштовна доставка від 1500 грн</span><span>·</span>
        <span>Лімітовані серії 1:18</span><span>·</span>
        <span>Подарунковий бокс у кожному замовленні</span><span>·</span>
        <span>Пресвідповіді: hello@rosegarage.shop</span><span>·</span>
        <span>Безкоштовна доставка від 1500 грн</span><span>·</span>
        <span>Лімітовані серії 1:18</span><span>·</span>
      </div>
    </div>

    <header class="topbar" :class="{ 'is-hidden': hidden, 'is-scrolled': scrolled }" role="banner">
      <div class="container topbar-inner">
        <RouterLink to="/" class="logo" aria-label="Rosé Garage — на головну">
          <span class="logo-mark" aria-hidden="true"></span>
          <span class="logo-text">
            <span class="logo-primary">Rosé</span>
            <span class="logo-secondary">Garage</span>
          </span>
        </RouterLink>

        <nav class="nav" aria-label="Головна навігація">
          <RouterLink to="/">Бутик</RouterLink>
          <RouterLink to="/about">Про нас</RouterLink>
          <RouterLink to="/contacts">Контакти</RouterLink>
          <RouterLink v-if="authState.user" to="/profile">Кабінет</RouterLink>
          <RouterLink v-if="authState.user?.role === 'admin'" to="/admin">Адмін</RouterLink>
        </nav>

        <div class="nav-tools">
          <button
            type="button"
            class="icon-btn"
            aria-label="Обране"
            @click="openWishlist"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" class="icon"><path d="M12 20 C12 20 4 14 4 9 C4 6 6 4 9 4 C10.6 4 11.6 5 12 6 C12.4 5 13.4 4 15 4 C18 4 20 6 20 9 C20 14 12 20 12 20Z"/></svg>
            <span v-if="wishlistCount" class="icon-badge">{{ wishlistCount }}</span>
          </button>

          <RouterLink to="/cart" class="icon-btn" aria-label="Кошик">
            <svg viewBox="0 0 24 24" aria-hidden="true" class="icon">
              <path d="M4 6h3l2 10h10l2-7H7"/>
              <circle cx="10" cy="20" r="1.4"/>
              <circle cx="18" cy="20" r="1.4"/>
            </svg>
            <span v-if="cartCount" class="icon-badge">{{ cartCount }}</span>
          </RouterLink>

          <RouterLink v-if="!authState.user" to="/auth" class="btn button-secondary btn-sm">
            Вхід
          </RouterLink>
          <button v-else type="button" class="btn button-ghost btn-sm" @click="handleLogout">
            Вийти
          </button>
        </div>
      </div>
    </header>

    <main id="main" class="container content" role="main">
      <RouterView v-slot="{ Component }">
        <Transition name="page" mode="out-in">
          <component :is="Component" />
        </Transition>
      </RouterView>
    </main>

    <section class="rose-strip" aria-label="Підписка на розсилку">
      <div class="container rose-strip-inner">
        <div>
          <p class="eyebrow">Rosé letter</p>
          <h2 class="rose-strip-title">Перші отримуйте новинки бутику</h2>
        </div>
        <div class="actions">
          <button type="button" class="btn button-primary" @click="openNewsletter">Підписатися</button>
          <RouterLink to="/about" class="btn button-secondary">Більше про бутик</RouterLink>
        </div>
      </div>
    </section>

    <footer class="site-footer" role="contentinfo">
      <div class="container footer-grid">
        <div>
          <RouterLink to="/" class="logo footer-logo">
            <span class="logo-mark" aria-hidden="true"></span>
            <span class="logo-text">
              <span class="logo-primary">Rosé</span>
              <span class="logo-secondary">Garage</span>
            </span>
          </RouterLink>
          <p class="meta">
            Кутюрний бутик колекційних моделей авто. Київ · Україна.
          </p>
        </div>
        <div>
          <h4 class="footer-title">Бутик</h4>
          <RouterLink to="/">Каталог</RouterLink>
          <RouterLink to="/about">Про нас</RouterLink>
          <RouterLink to="/contacts">Контакти</RouterLink>
        </div>
        <div>
          <h4 class="footer-title">Аккаунт</h4>
          <RouterLink v-if="!authState.user" to="/auth">Вхід / реєстрація</RouterLink>
          <RouterLink v-if="authState.user" to="/profile">Особистий кабінет</RouterLink>
          <RouterLink to="/cart">Кошик</RouterLink>
          <button type="button" class="footer-link-btn" @click="openWishlist">Обране</button>
        </div>
        <div>
          <h4 class="footer-title">Контакти</h4>
          <a href="tel:+380440000000">+380 44 000 00 00</a>
          <a href="mailto:hello@rosegarage.shop">hello@rosegarage.shop</a>
          <span class="meta">Пн–Нд · 10:00–20:00</span>
        </div>
      </div>
      <div class="container footer-bottom">
        <span>© {{ year }} Rosé Garage. Всі права захищені.</span>
        <span>Made with ♡ in Kyiv</span>
      </div>
    </footer>

    <aside v-if="showConsent" class="consent" role="dialog" aria-label="Згода на аналітику">
      <strong>Аналітика та якість сервісу</strong>
      <p class="no-margin">
        Ми використовуємо анонімну аналітику, щоб покращувати бутик. Можете увімкнути її або відмовитися.
      </p>
      <div class="consent-actions">
        <button type="button" class="button-primary" @click="onAcceptConsent">Прийняти</button>
        <button type="button" class="button-secondary" @click="onDeclineConsent">Відхилити</button>
      </div>
    </aside>

    <WishlistDrawer />
    <NewsletterModal />
  </div>
</template>

<script setup>
import { computed, onMounted, onBeforeUnmount, ref } from 'vue'
import { useRouter, RouterLink, RouterView } from 'vue-router'
import { cartCount } from './stores/cartStore'
import { authState, loadCurrentUser, logout } from './stores/authStore'
import { consentState, grantConsent, declineConsent } from './utils/consent'
import { wishlistCount, openWishlist } from './stores/wishlistStore'
import { openNewsletter } from './utils/newsletter'
import WishlistDrawer from './components/WishlistDrawer.vue'
import NewsletterModal from './components/NewsletterModal.vue'

const router = useRouter()

const year = new Date().getFullYear()
const hidden = ref(false)
const scrolled = ref(false)
const showConsent = computed(() => !consentState.status)

let lastY = 0
function onScroll() {
  const y = window.scrollY || 0
  scrolled.value = y > 12
  const delta = y - lastY
  if (y > 140 && delta > 6) hidden.value = true
  else if (delta < -4) hidden.value = false
  lastY = y
}

function onAcceptConsent() { grantConsent() }
function onDeclineConsent() { declineConsent() }

onMounted(async () => {
  window.addEventListener('scroll', onScroll, { passive: true })
  if (authState.token && !authState.user) {
    try { await loadCurrentUser() } catch { /* session cleared in store */ }
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScroll)
})

function handleLogout() {
  logout()
  router.push('/auth')
}
</script>
