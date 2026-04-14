import { createRouter, createWebHistory } from 'vue-router'
import HomePage from './pages/HomePage.vue'
import ProductPage from './pages/ProductPage.vue'
import CartPage from './pages/CartPage.vue'
import AuthPage from './pages/AuthPage.vue'
import ProfilePage from './pages/ProfilePage.vue'
import AdminPage from './pages/AdminPage.vue'
import AboutPage from './pages/AboutPage.vue'
import ContactsPage from './pages/ContactsPage.vue'
import { authState } from './stores/authStore'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: HomePage },
    { path: '/product/:id', name: 'product', component: ProductPage, props: true },
    { path: '/cart', name: 'cart', component: CartPage },
    { path: '/auth', name: 'auth', component: AuthPage },
    { path: '/profile', name: 'profile', component: ProfilePage },
    { path: '/about', name: 'about', component: AboutPage },
    { path: '/contacts', name: 'contacts', component: ContactsPage },
    { path: '/admin', name: 'admin', component: AdminPage, meta: { requiresAdmin: true } },
  ],
  scrollBehavior(to, from, saved) {
    if (saved) return saved
    if (to.hash) return { el: to.hash, behavior: 'smooth' }
    return { top: 0, behavior: 'smooth' }
  },
})

router.beforeEach((to) => {
  if (to.meta.requiresAdmin && authState.user?.role !== 'admin') {
    return '/auth'
  }
})

export default router
