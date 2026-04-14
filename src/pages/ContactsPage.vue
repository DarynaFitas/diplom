<template>
  <section>
    <p class="eyebrow">Контакти</p>
    <h1 class="page-title">Напишіть нам — відповімо упродовж години</h1>
    <p class="page-lead meta">
      Допоможемо підібрати модель для подарунку, розкажемо про лімітовані серії або пояснимо масштаби.
      Ми у Києві, але працюємо по всій Україні.
    </p>

    <div class="contacts-grid">
      <div class="card contact-block" v-reveal>
        <p class="eyebrow no-lines">Атьельє</p>
        <h3>Київ, Подільський район</h3>
        <p class="meta">Вул. Костянтинівська 29, 2 поверх · По запису</p>
      </div>
      <div class="card contact-block" v-reveal="{ delay: 80 }">
        <p class="eyebrow no-lines">Телефон</p>
        <h3>+380 44 000 00 00</h3>
        <p class="meta">Щодня з 10:00 до 20:00</p>
      </div>
      <div class="card contact-block" v-reveal="{ delay: 160 }">
        <p class="eyebrow no-lines">Пошта</p>
        <h3>hello@rosegarage.shop</h3>
        <p class="meta">Для замовлень та пресслужби</p>
      </div>
    </div>

    <div class="card contact-form-card" v-reveal>
      <div class="contact-form-intro">
        <p class="eyebrow">Форма звʼязку</p>
        <h2>Залиште повідомлення</h2>
        <p class="meta">
          Ми передзвонимо або напишемо протягом години у робочий час.
          Усі поля з зіркою обовʼязкові.
        </p>
      </div>
      <form class="form" @submit.prevent="submit">
        <div class="admin-grid-2">
          <div class="field">
            <label class="field-label" for="contact-name">Імʼя *</label>
            <input id="contact-name" v-model.trim="form.name" type="text" required />
          </div>
          <div class="field">
            <label class="field-label" for="contact-email">Email *</label>
            <input id="contact-email" v-model.trim="form.email" type="email" required />
          </div>
        </div>
        <div class="field">
          <label class="field-label" for="contact-topic">Тема</label>
          <select id="contact-topic" v-model="form.topic">
            <option value="order">Питання щодо замовлення</option>
            <option value="custom">Пошук рідкісної моделі</option>
            <option value="press">Співпраця / преса</option>
            <option value="other">Інше</option>
          </select>
        </div>
        <div class="field">
          <label class="field-label" for="contact-message">Повідомлення *</label>
          <textarea id="contact-message" v-model="form.message" rows="5" required></textarea>
        </div>
        <button type="submit" class="button-primary" :disabled="sent">
          {{ sent ? 'Дякуємо за звернення ✓' : 'Надіслати' }}
        </button>
        <p v-if="sent" class="success-text">
          Ми отримали ваше повідомлення та звʼяжемося найближчим часом.
        </p>
      </form>
    </div>
  </section>
</template>

<script setup>
import { reactive, ref } from 'vue'

const form = reactive({
  name: '',
  email: '',
  topic: 'order',
  message: '',
})
const sent = ref(false)

function submit() {
  sent.value = true
  // Form submissions are stored locally as a simple demo; a real integration
  // would POST to a backend endpoint.
  try {
    const key = 'rose_contacts'
    const prev = JSON.parse(localStorage.getItem(key) || '[]')
    prev.push({ ...form, createdAt: new Date().toISOString() })
    localStorage.setItem(key, JSON.stringify(prev))
  } catch { /* ignore */ }
}
</script>
