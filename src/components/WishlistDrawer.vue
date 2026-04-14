<template>
  <Transition name="drawer">
    <div
      v-if="wishlistState.open"
      class="drawer-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="wishlist-title"
      @click.self="close"
      @keydown.esc="close"
    >
      <aside class="drawer">
        <header class="drawer-head">
          <div>
            <p class="eyebrow no-lines">Обране</p>
            <h2 id="wishlist-title" class="drawer-title">Ваша шкатулка бажань</h2>
          </div>
          <button
            type="button"
            class="drawer-close"
            aria-label="Закрити обране"
            @click="close"
          >✕</button>
        </header>

        <div v-if="!wishlistState.items.length" class="drawer-empty">
          <div class="drawer-empty-mark" aria-hidden="true">♡</div>
          <p class="meta">
            Тут будуть моделі, які ви зберегли, щоб не загубити.
            Натисніть на сердечко біля товару, щоб додати його сюди.
          </p>
        </div>

        <ul v-else class="drawer-list">
          <li v-for="item in wishlistState.items" :key="item.id" class="drawer-item">
            <RouterLink :to="`/product/${item.id}`" class="drawer-item-link" @click="close">
              <img
                :src="item.image"
                :alt="item.name"
                width="120"
                height="90"
                loading="lazy"
                decoding="async"
              />
              <div class="drawer-item-body">
                <p class="eyebrow no-lines">{{ item.category }}</p>
                <strong>{{ item.name }}</strong>
                <span class="price">{{ item.price }} грн</span>
              </div>
            </RouterLink>
            <div class="drawer-item-actions">
              <button type="button" class="button-primary btn-sm" @click="moveToCart(item)">
                У кошик
              </button>
              <button type="button" class="button-ghost btn-sm" @click="removeFromWishlist(item.id)">
                Прибрати
              </button>
            </div>
          </li>
        </ul>

        <footer v-if="wishlistState.items.length" class="drawer-foot">
          <button type="button" class="button-ghost" @click="clearAll">Очистити все</button>
          <RouterLink to="/cart" class="btn button-secondary" @click="close">Перейти в кошик</RouterLink>
        </footer>
      </aside>
    </div>
  </Transition>
</template>

<script setup>
import { RouterLink } from 'vue-router'
import {
  wishlistState,
  closeWishlist,
  removeFromWishlist,
} from '../stores/wishlistStore'
import { addToCart } from '../stores/cartStore'

function close() { closeWishlist() }

function moveToCart(item) {
  addToCart(item)
  removeFromWishlist(item.id)
}

function clearAll() {
  wishlistState.items.splice(0, wishlistState.items.length)
}
</script>
