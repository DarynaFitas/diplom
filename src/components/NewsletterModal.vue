<template>
  <Transition name="modal">
    <div
      v-if="newsletterState.open"
      class="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="newsletter-title"
      @click.self="close"
      @keydown.esc="close"
    >
      <div class="modal newsletter-modal">
        <button
          type="button"
          class="modal-close"
          aria-label="Закрити"
          @click="close"
        >✕</button>
        <div class="newsletter-aside" aria-hidden="true">
          <div class="newsletter-spark"></div>
        </div>
        <div class="newsletter-body">
          <p class="eyebrow">Rosé letter</p>
          <h2 id="newsletter-title" class="newsletter-title">
            Перші дізнавайтесь про новинки бутику
          </h2>
          <p class="meta">
            Лімітовані серії, закриті розпродажі й рожеві дропи — раз на місяць,
            без спаму. Можна відписатися одним кліком.
          </p>

          <form class="form" @submit.prevent="submit">
            <div class="field">
              <label class="field-label" for="news-name">Як до вас звертатися</label>
              <input id="news-name" v-model.trim="form.name" type="text" placeholder="Імʼя" />
            </div>
            <div class="field">
              <label class="field-label" for="news-email">Email *</label>
              <input id="news-email" v-model.trim="form.email" type="email" required placeholder="you@rosegarage.shop" />
            </div>
            <button type="submit" class="button-primary button-block" :disabled="sent">
              {{ sent ? 'Ви підписані ✓' : 'Підписатися' }}
            </button>
            <p v-if="sent" class="success-text">
              Дякуємо! Перший лист — за тиждень.
            </p>
          </form>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { reactive, ref, watch } from 'vue'
import { newsletterState, closeNewsletter } from '../utils/newsletter'

const form = reactive({ name: '', email: '' })
const sent = ref(false)

function close() { closeNewsletter() }

function submit() {
  if (!form.email) return
  sent.value = true
  try {
    const key = 'rose_newsletter'
    const prev = JSON.parse(localStorage.getItem(key) || '[]')
    prev.push({ ...form, createdAt: new Date().toISOString() })
    localStorage.setItem(key, JSON.stringify(prev))
  } catch { /* ignore */ }
  setTimeout(close, 1400)
}

watch(() => newsletterState.open, (open) => {
  if (!open) {
    form.name = ''
    form.email = ''
    sent.value = false
  }
})
</script>
