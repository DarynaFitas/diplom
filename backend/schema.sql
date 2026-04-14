-- Postgres schema for Rosé Garage / CarModel Shop
-- Server creates these automatically via ensureSchema(); this file is a reference
-- for manual initialization (psql -f schema-pg.sql).

CREATE TABLE IF NOT EXISTS users (
  id            INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name          VARCHAR(120)  NOT NULL,
  email         VARCHAR(190)  NOT NULL UNIQUE,
  phone         VARCHAR(20)   NOT NULL,
  password_hash TEXT          NOT NULL,
  role          VARCHAR(20)   NOT NULL DEFAULT 'user',
  created_at    TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
  id          INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name        VARCHAR(255)  NOT NULL,
  brand       VARCHAR(100)  NOT NULL,
  scale       VARCHAR(50)   NOT NULL,
  price       DECIMAL(10,2) NOT NULL,
  description TEXT,
  image_url   BYTEA,
  stock       INTEGER       DEFAULT 0,
  created_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS product_specs (
  id         INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  product_id INTEGER      NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  spec_name  VARCHAR(100) NOT NULL,
  spec_value VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS orders (
  id             INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id        INTEGER REFERENCES users(id) ON DELETE SET NULL,
  customer_name  VARCHAR(150)  NOT NULL,
  customer_email VARCHAR(150)  NOT NULL,
  customer_phone VARCHAR(20),
  total_amount   DECIMAL(10,2) NOT NULL,
  status         VARCHAR(50)   DEFAULT 'new',
  created_at     TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS order_items (
  id         INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  order_id   INTEGER       NOT NULL REFERENCES orders(id)   ON DELETE CASCADE,
  product_id INTEGER       NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity   INTEGER       NOT NULL DEFAULT 1,
  price      DECIMAL(10,2) NOT NULL
);

CREATE TABLE IF NOT EXISTS reviews (
  id          INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  product_id  INTEGER      NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id     INTEGER      REFERENCES users(id) ON DELETE SET NULL,
  author_name VARCHAR(100),
  rating      INTEGER      NOT NULL,
  comment     TEXT         NOT NULL,
  created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);
