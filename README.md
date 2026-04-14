# Rosé Garage — Vue + Express + Postgres + GA4

Бутик колекційних моделей авто для дипломного проєкту.

## Що є в проєкті
- Vue 3 + Vite frontend
- Express + Postgres backend (запасна MySQL-версія — у `backend/legacy-mysql/`)
- Google Analytics 4 події `view_item`, `add_to_cart`, `purchase`
- Реєстрація та авторизація
- Особистий кабінет
- Відгуки, прив'язані до акаунтів
- Замовлення, прив'язані до користувача
- Підтримка зображень у полі `products.image_url`, навіть якщо це `BYTEA`

## Запуск

### Frontend
```bash
npm install
npm run dev
```

### Backend
```bash
cd backend
npm install
npm run dev
```

## Налаштування БД
Файл `.env` у папці `backend`:

```env
PORT=3001
PG_HOST=localhost
PG_PORT=5432
PG_DATABASE=carmodel_shop
PG_USER=postgres
PG_PASSWORD=
TOKEN_SECRET=super-secret-token
```

## Важливо про картинки
Поле `products.image_url` може бути:
- звичайним URL або шляхом до картинки
- або `BYTEA` з бінарними даними картинки

Backend автоматично перетворює бінарник у `data:image/...;base64,...`, тому фронтенд може показувати таке зображення без додаткових дій.

## Що ще треба зробити вручну
- вставити свій GA4 Measurement ID у `index.html`
- якщо в таблиці `reviews` ще немає `user_id`, backend спробує додати поле автоматично
- якщо в таблиці `orders` ще немає `user_id` або `customer_phone`, backend теж спробує додати їх автоматично
