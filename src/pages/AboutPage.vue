<template>
  <section>
    <p class="eyebrow">Про нас</p>
    <h1 class="page-title">Rosé Garage — атмосфера couture, серце для колекціонерок і колекціонерів</h1>
    <p class="page-lead meta">
      Ми зібрали найкращі масштабні моделі у рожевому бутіку, який хочеться відкривати щоранку.
      Кожен екземпляр у нашому каталозі ми відбираємо особисто — за деталізацію, якість литва й характер.
    </p>

    <div class="about-grid">
      <article class="card about-block" v-reveal>
        <div class="about-icon" aria-hidden="true">✦</div>
        <h3>Кураторська добірка</h3>
        <p class="meta">
          Ми не продаємо все підряд. У бутику — лише ті моделі, які пройшли наш власний
          рев'ю чек-лист: зазор корпусу, точність емблем, відтінок фарби, робота шасі.
        </p>
      </article>
      <article class="card about-block" v-reveal="{ delay: 80 }">
        <div class="about-icon" aria-hidden="true">♡</div>
        <h3>Подарункове упакування</h3>
        <p class="meta">
          За замовчуванням моделі приїжджають у фірмовому бутіковому боксі з рожевими стрічками —
          щоб розпакувати їх хотілося повільно й з кавою.
        </p>
      </article>
      <article class="card about-block" v-reveal="{ delay: 160 }">
        <div class="about-icon" aria-hidden="true">◆</div>
        <h3>Лімітовані серії</h3>
        <p class="meta">
          Більшість позицій у бутику — лімітовані партії. Якщо модель залишилася 1 шт. на складі,
          ми чесно про це попередимо у картці товару.
        </p>
      </article>
      <article class="card about-block" v-reveal="{ delay: 240 }">
        <div class="about-icon" aria-hidden="true">✧</div>
        <h3>Доставка 24 год</h3>
        <p class="meta">
          По всій Україні — через Нову Пошту. Гарантуємо відправку протягом 24 годин після оплати,
          а для Києва діє кур’єрська доставка “того ж дня”.
        </p>
      </article>
    </div>

    <div class="about-story card" v-reveal>
      <p class="eyebrow">Історія бренду</p>
      <h2>Від однієї моделі BMW до рожевого гаража</h2>
      <p>
        Усе почалося з однієї BMW M3 GTR у 1:24 — подарунку, який довго шукали по комісійних групах.
        Так з’явилася ідея: зробити магазин, де моделі підбирають, як прикрасу на комод.
      </p>
      <p>
        Сьогодні в Rosé Garage понад сотня позицій від Porsche до Skoda, і над кожною ми прицільно
        думаємо — як її поставити на полицю так, щоб захотілося розглядати.
      </p>
      <RouterLink to="/" class="btn button-primary">До каталогу</RouterLink>
    </div>
  </section>
</template>

<script setup>
import { RouterLink } from 'vue-router'
</script>
