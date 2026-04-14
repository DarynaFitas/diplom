# Legacy MySQL backend

Вихідна MySQL-версія API (до міграції на Postgres).
Залишена як backup. Основний сервер — `backend/server.js` (Postgres).

## Запуск (якщо треба підняти саме MySQL-версію)

З кореня проєкту:
```bash
cd backend
# .env має містити MySQL-змінні:
#   DB_HOST=localhost
#   DB_PORT=3306
#   DB_USER=root
#   DB_PASSWORD=
#   DB_NAME=carmodel_shop
npm run start:mysql
```

Дамп БД: `carmodel_shop.sql` у корені репо (якщо не виключений `.gitignore`).

Для стандартного Postgres-запуску — `npm start` (без :mysql).
