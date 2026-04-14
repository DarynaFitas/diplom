import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import crypto from 'crypto'
import { pool } from './db.js'

dotenv.config()

const app = express()
const PORT = Number(process.env.PORT || 3001)
const TOKEN_SECRET = process.env.TOKEN_SECRET || 'change-me-super-secret'
const DEFAULT_ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@shop.local'
const DEFAULT_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123'
const DEFAULT_ADMIN_NAME = process.env.ADMIN_NAME || 'admin'

app.use(cors())
app.use(express.json({ limit: '20mb' }))

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim())
}

function isValidPhone(phone) {
  return /^\+?[0-9]{10,15}$/.test(String(phone || '').replace(/[\s()-]/g, ''))
}

function normalizePhone(phone) {
  return String(phone || '').replace(/[\s()-]/g, '')
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${hash}`
}

function verifyPassword(password, storedHash) {
  const [salt, originalHash] = String(storedHash || '').split(':')
  if (!salt || !originalHash) return false
  const hash = crypto.scryptSync(password, salt, 64).toString('hex')
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(originalHash, 'hex'))
}

function base64UrlEncode(value) {
  return Buffer.from(value)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
}

function base64UrlDecode(value) {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((value.length + 3) % 4)
  return Buffer.from(padded, 'base64').toString()
}

function signToken(payload) {
  const header = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const body = base64UrlEncode(JSON.stringify(payload))
  const signature = crypto
    .createHmac('sha256', TOKEN_SECRET)
    .update(`${header}.${body}`)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
  return `${header}.${body}.${signature}`
}

function verifyToken(token) {
  const [header, body, signature] = String(token || '').split('.')
  if (!header || !body || !signature) {
    throw new Error('Недійсний токен')
  }

  const expected = crypto
    .createHmac('sha256', TOKEN_SECRET)
    .update(`${header}.${body}`)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')

  if (signature !== expected) {
    throw new Error('Недійсний підпис токена')
  }

  const payload = JSON.parse(base64UrlDecode(body))
  if (payload.exp && Date.now() > payload.exp) {
    throw new Error('Термін дії токена завершився')
  }

  return payload
}

function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''

    if (!token) {
      return res.status(401).json({ message: 'Потрібна авторизація.' })
    }

    req.user = verifyToken(token)
    next()
  } catch (error) {
    return res.status(401).json({ message: error.message || 'Помилка авторизації.' })
  }
}

function adminMiddleware(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Доступ лише для адміністратора.' })
  }
  next()
}

function detectMimeType(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 4) return 'image/jpeg'
  if (buffer[0] === 0xff && buffer[1] === 0xd8) return 'image/jpeg'
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) return 'image/png'
  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) return 'image/gif'
  if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46) return 'image/webp'
  return 'image/jpeg'
}

function extractExternalImage(rawValue) {
  if (!rawValue) return null
  const candidate = Buffer.isBuffer(rawValue)
    ? rawValue.toString('utf8').trim()
    : String(rawValue).trim()
  if (/^(https?:\/\/|\/)/i.test(candidate)) return candidate
  return null
}

function getImageUrl(row) {
  const external = extractExternalImage(row?.image_url)
  if (external) return external
  if (row?.image_url) {
    const version = row.updated_at || row.created_at || Date.now()
    const stamp = version instanceof Date ? version.getTime() : new Date(version).getTime() || Date.now()
    return `/api/products/${row.id}/image?v=${stamp}`
  }
  return '/og-cover.svg'
}

function bufferToBinaryImage(buffer) {
  if (!Buffer.isBuffer(buffer)) return null
  const asText = buffer.toString('utf8').trim()
  const dataMatch = asText.match(/^data:(image\/[a-zA-Z+.-]+);base64,(.+)$/)
  if (dataMatch) {
    return { mimeType: dataMatch[1], data: Buffer.from(dataMatch[2], 'base64') }
  }
  const mimeType = detectMimeType(buffer)
  return { mimeType, data: buffer }
}

function normalizeProductImage(image) {
  if (!image) return null
  if (Buffer.isBuffer(image)) return image
  return Buffer.from(String(image).trim(), 'utf8')
}

function buildTokenForUser(user) {
  return signToken({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role || 'user',
    exp: Date.now() + 1000 * 60 * 60 * 24 * 7,
  })
}

async function ensureForeignKey(tableName, constraintName, sql) {
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS count
     FROM information_schema.TABLE_CONSTRAINTS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND CONSTRAINT_NAME = ?`,
    [tableName, constraintName]
  )

  if (!rows[0]?.count) {
    await pool.query(sql)
  }
}

async function ensureSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(120) NOT NULL,
      email VARCHAR(190) NOT NULL UNIQUE,
      phone VARCHAR(20) NOT NULL,
      password_hash TEXT NOT NULL,
      role VARCHAR(20) NOT NULL DEFAULT 'user',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `)

  await pool.query(`
    CREATE TABLE IF NOT EXISTS products (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      brand VARCHAR(100) NOT NULL,
      scale VARCHAR(50) NOT NULL,
      price DECIMAL(10,2) NOT NULL,
      description TEXT,
      image_url LONGBLOB NULL,
      stock INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `)

  await pool.query(`
    CREATE TABLE IF NOT EXISTS product_specs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      product_id INT NOT NULL,
      spec_name VARCHAR(100) NOT NULL,
      spec_value VARCHAR(255) NOT NULL,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `)

  await pool.query(`
    CREATE TABLE IF NOT EXISTS orders (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NULL,
      customer_name VARCHAR(150) NOT NULL,
      customer_email VARCHAR(150) NOT NULL,
      customer_phone VARCHAR(20) NULL,
      total_amount DECIMAL(10,2) NOT NULL,
      status VARCHAR(50) DEFAULT 'new',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `)

  await pool.query(`
    CREATE TABLE IF NOT EXISTS order_items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      order_id INT NOT NULL,
      product_id INT NOT NULL,
      quantity INT NOT NULL DEFAULT 1,
      price DECIMAL(10,2) NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `)

  await pool.query(`
    CREATE TABLE IF NOT EXISTS reviews (
      id INT AUTO_INCREMENT PRIMARY KEY,
      product_id INT NOT NULL,
      user_id INT NULL,
      author_name VARCHAR(100) NULL,
      rating INT NOT NULL,
      comment TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `)

  const addColumnIfMissing = async (tableName, columnName, sql) => {
    const [rows] = await pool.query(
      `SELECT COUNT(*) AS count FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
      [tableName, columnName]
    )

    if (!rows[0]?.count) {
      await pool.query(`ALTER TABLE ${tableName} ADD COLUMN ${sql}`)
    }
  }

  await addColumnIfMissing('users', 'role', "role VARCHAR(20) NOT NULL DEFAULT 'user'")
  await addColumnIfMissing('reviews', 'user_id', 'user_id INT NULL')
  await addColumnIfMissing('orders', 'user_id', 'user_id INT NULL')
  await addColumnIfMissing('orders', 'customer_phone', 'customer_phone VARCHAR(20) NULL')

  await ensureForeignKey(
    'reviews',
    'fk_reviews_user',
    'ALTER TABLE reviews ADD CONSTRAINT fk_reviews_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL'
  )
  await ensureForeignKey(
    'orders',
    'fk_orders_user',
    'ALTER TABLE orders ADD CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL'
  )

  const [adminRows] = await pool.query('SELECT id FROM users WHERE email = ? LIMIT 1', [DEFAULT_ADMIN_EMAIL])
  if (!adminRows.length) {
    await pool.query(
      'INSERT INTO users (name, email, phone, password_hash, role) VALUES (?, ?, ?, ?, ?)',
      [DEFAULT_ADMIN_NAME, DEFAULT_ADMIN_EMAIL, '+380000000000', hashPassword(DEFAULT_ADMIN_PASSWORD), 'admin']
    )
    console.log(`Default admin created: ${DEFAULT_ADMIN_EMAIL} / ${DEFAULT_ADMIN_PASSWORD}`)
  } else {
    await pool.query('UPDATE users SET role = ? WHERE email = ?', ['admin', DEFAULT_ADMIN_EMAIL])
  }
}

app.get('/api/health', async (_req, res) => {
  try {
    const [rows] = await pool.query('SELECT 1 AS ok')
    res.json({ status: 'ok', database: rows[0]?.ok === 1 ? 'connected' : 'unknown' })
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message })
  }
})

app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, phone, password } = req.body

    if (!name || name.trim().length < 2) {
      return res.status(400).json({ message: 'Ім’я має містити щонайменше 2 символи.' })
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ message: 'Введи коректну email адресу.' })
    }

    if (!isValidPhone(phone)) {
      return res.status(400).json({ message: 'Введи коректний номер телефону.' })
    }

    if (!password || String(password).length < 6) {
      return res.status(400).json({ message: 'Пароль має містити щонайменше 6 символів.' })
    }

    const normalizedEmail = String(email).trim().toLowerCase()
    const normalizedPhone = normalizePhone(phone)

    const [existing] = await pool.query('SELECT id FROM users WHERE email = ? LIMIT 1', [normalizedEmail])
    if (existing.length) {
      return res.status(409).json({ message: 'Користувач з такою поштою вже існує.' })
    }

    const passwordHash = hashPassword(password)
    const role = normalizedEmail === DEFAULT_ADMIN_EMAIL ? 'admin' : 'user'

    const [result] = await pool.query(
      'INSERT INTO users (name, email, phone, password_hash, role) VALUES (?, ?, ?, ?, ?)',
      [name.trim(), normalizedEmail, normalizedPhone, passwordHash, role]
    )

    const user = {
      id: result.insertId,
      name: name.trim(),
      email: normalizedEmail,
      phone: normalizedPhone,
      role,
    }

    res.status(201).json({ token: buildTokenForUser(user), user })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body
    const identifier = String(email || '').trim().toLowerCase()

    const [rows] = await pool.query(
      'SELECT * FROM users WHERE LOWER(email) = ? OR LOWER(name) = ? LIMIT 1',
      [identifier, identifier]
    )
    const user = rows[0]

    if (!user || !verifyPassword(password, user.password_hash)) {
      return res.status(401).json({ message: 'Неправильна пошта або пароль.' })
    }

    res.json({
      token: buildTokenForUser(user),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role || 'user',
      },
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

app.get('/api/auth/me', authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, name, email, phone, role, created_at FROM users WHERE id = ? LIMIT 1', [req.user.id])
    const user = rows[0]
    if (!user) {
      return res.status(404).json({ message: 'Користувача не знайдено.' })
    }
    res.json(user)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

app.get('/api/my/orders', authMiddleware, async (req, res) => {
  try {
    const [orders] = await pool.query(
      `SELECT id, total_amount, status, created_at
       FROM orders
       WHERE user_id = ?
       ORDER BY created_at DESC, id DESC`,
      [req.user.id]
    )

    const formatted = []
    for (const order of orders) {
      const [items] = await pool.query(
        `SELECT oi.quantity, oi.price, p.name
         FROM order_items oi
         JOIN products p ON p.id = oi.product_id
         WHERE oi.order_id = ?`,
        [order.id]
      )

      formatted.push({
        id: order.id,
        totalAmount: Number(order.total_amount),
        status: order.status,
        createdAt: order.created_at,
        items: items.map((item) => ({
          name: item.name,
          quantity: Number(item.quantity),
          price: Number(item.price),
        })),
      })
    }

    res.json(formatted)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

app.get('/api/products', async (_req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT p.id, p.name, p.brand, p.scale, p.price, p.description, p.image_url, p.stock, p.created_at
      FROM products p
      ORDER BY p.id ASC
    `)

    const products = rows.map((row) => ({
      id: row.id,
      name: row.name,
      brand: row.brand,
      scale: row.scale,
      category: `${row.brand} · ${row.scale}`,
      price: Number(row.price),
      description: row.description,
      image: getImageUrl(row),
      stock: Number(row.stock),
    }))

    res.json(products)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

app.get('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params

    const [products] = await pool.query(
      `SELECT p.id, p.name, p.brand, p.scale, p.price, p.description, p.image_url, p.stock, p.created_at
       FROM products p
       WHERE p.id = ?
       LIMIT 1`,
      [id]
    )

    if (!products.length) {
      return res.status(404).json({ message: 'Товар не знайдено' })
    }

    const [specRows] = await pool.query(
      `SELECT spec_name, spec_value
       FROM product_specs
       WHERE product_id = ?
       ORDER BY id ASC`,
      [id]
    )

    const [reviews] = await pool.query(
      `SELECT r.id, COALESCE(u.name, r.author_name, 'Користувач') AS author, r.rating, r.comment, r.created_at
       FROM reviews r
       LEFT JOIN users u ON u.id = r.user_id
       WHERE r.product_id = ?
       ORDER BY r.created_at DESC, r.id DESC`,
      [id]
    )

    const product = products[0]
    const specifications = Object.fromEntries(specRows.map((row) => [row.spec_name, row.spec_value]))

    res.json({
      id: product.id,
      name: product.name,
      brand: product.brand,
      scale: product.scale,
      category: `${product.brand} · ${product.scale}`,
      price: Number(product.price),
      description: product.description,
      image: getImageUrl(product),
      stock: Number(product.stock),
      specifications,
      reviews: reviews.map((review) => ({ ...review, rating: Number(review.rating) })),
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

app.get('/api/products/:id/image', async (req, res) => {
  try {
    const { id } = req.params
    const [rows] = await pool.query(
      'SELECT image_url, created_at FROM products WHERE id = ? LIMIT 1',
      [id]
    )
    const row = rows[0]
    if (!row || !row.image_url) {
      res.redirect(302, '/og-cover.svg')
      return
    }

    const external = extractExternalImage(row.image_url)
    if (external) {
      res.redirect(302, external)
      return
    }

    const binary = bufferToBinaryImage(row.image_url)
    if (!binary) {
      res.status(404).json({ message: 'Зображення не знайдено.' })
      return
    }

    const lastModified = row.created_at instanceof Date
      ? row.created_at.toUTCString()
      : new Date(row.created_at || Date.now()).toUTCString()

    res.setHeader('Content-Type', binary.mimeType)
    res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800, immutable')
    res.setHeader('Last-Modified', lastModified)
    res.setHeader('Content-Length', binary.data.length)
    res.end(binary.data)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

app.post('/api/products/:id/reviews', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params
    const { rating, comment } = req.body

    if (!comment || String(comment).trim().length < 5 || !rating) {
      return res.status(400).json({ message: 'Оціни товар і напиши змістовний відгук.' })
    }

    const [userRows] = await pool.query('SELECT name FROM users WHERE id = ? LIMIT 1', [req.user.id])
    const user = userRows[0]
    if (!user) {
      return res.status(404).json({ message: 'Користувача не знайдено.' })
    }

    await pool.query(
      'INSERT INTO reviews (product_id, user_id, author_name, rating, comment) VALUES (?, ?, ?, ?, ?)',
      [id, req.user.id, user.name, Number(rating), String(comment).trim()]
    )

    res.status(201).json({ message: 'Відгук успішно додано.' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

app.post('/api/orders', authMiddleware, async (req, res) => {
  const connection = await pool.getConnection()

  try {
    const { items } = req.body

    if (!Array.isArray(items) || !items.length) {
      return res.status(400).json({ message: 'Кошик порожній.' })
    }

    const [userRows] = await connection.query(
      'SELECT id, name, email, phone FROM users WHERE id = ? LIMIT 1',
      [req.user.id]
    )
    const user = userRows[0]

    if (!user) {
      return res.status(404).json({ message: 'Користувача не знайдено.' })
    }

    const totalAmount = items.reduce((sum, item) => sum + Number(item.price) * Number(item.quantity), 0)

    await connection.beginTransaction()

    const [orderResult] = await connection.query(
      'INSERT INTO orders (user_id, customer_name, customer_email, customer_phone, total_amount, status) VALUES (?, ?, ?, ?, ?, ?)',
      [user.id, user.name, user.email, user.phone, totalAmount, 'new']
    )

    const orderId = orderResult.insertId

    for (const item of items) {
      await connection.query(
        'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
        [orderId, item.id, Number(item.quantity), Number(item.price)]
      )
    }

    await connection.commit()
    res.status(201).json({ message: 'Замовлення успішно оформлено.', orderId, totalAmount })
  } catch (error) {
    await connection.rollback()
    res.status(500).json({ message: error.message })
  } finally {
    connection.release()
  }
})

app.get('/api/admin/users', authMiddleware, adminMiddleware, async (_req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, name, email, phone, role, created_at FROM users ORDER BY created_at DESC, id DESC'
    )
    res.json(rows)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

app.put('/api/admin/users/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params
    const { name, email, phone, role, password } = req.body

    if (!name || name.trim().length < 2) {
      return res.status(400).json({ message: 'Ім’я має містити щонайменше 2 символи.' })
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ message: 'Некоректний email.' })
    }
    if (!isValidPhone(phone)) {
      return res.status(400).json({ message: 'Некоректний номер телефону.' })
    }

    const allowedRole = role === 'admin' ? 'admin' : 'user'
    const normalizedEmail = String(email).trim().toLowerCase()
    const normalizedPhone = normalizePhone(phone)

    const [existing] = await pool.query('SELECT id FROM users WHERE email = ? AND id <> ? LIMIT 1', [normalizedEmail, id])
    if (existing.length) {
      return res.status(409).json({ message: 'Інший користувач уже має таку пошту.' })
    }

    if (password && String(password).length < 6) {
      return res.status(400).json({ message: 'Новий пароль має містити щонайменше 6 символів.' })
    }

    if (password) {
      await pool.query(
        'UPDATE users SET name = ?, email = ?, phone = ?, role = ?, password_hash = ? WHERE id = ?',
        [name.trim(), normalizedEmail, normalizedPhone, allowedRole, hashPassword(password), id]
      )
    } else {
      await pool.query(
        'UPDATE users SET name = ?, email = ?, phone = ?, role = ? WHERE id = ?',
        [name.trim(), normalizedEmail, normalizedPhone, allowedRole, id]
      )
    }

    res.json({ message: 'Користувача оновлено.' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

app.delete('/api/admin/users/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params
    if (Number(id) === Number(req.user.id)) {
      return res.status(400).json({ message: 'Не можна видалити власний акаунт адміністратора.' })
    }
    await pool.query('DELETE FROM users WHERE id = ?', [id])
    res.json({ message: 'Користувача видалено.' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

app.get('/api/admin/products', authMiddleware, adminMiddleware, async (_req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, name, brand, scale, price, description, image_url, stock, created_at FROM products ORDER BY id DESC'
    )
    const products = []
    for (const row of rows) {
      const [specRows] = await pool.query(
        'SELECT id, spec_name, spec_value FROM product_specs WHERE product_id = ? ORDER BY id ASC',
        [row.id]
      )
      products.push({
        id: row.id,
        name: row.name,
        brand: row.brand,
        scale: row.scale,
        price: Number(row.price),
        description: row.description,
        image: getImageUrl(row),
        stock: Number(row.stock),
        specifications: specRows.map((item) => ({ id: item.id, name: item.spec_name, value: item.spec_value })),
        createdAt: row.created_at,
      })
    }
    res.json(products)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

app.post('/api/admin/products', authMiddleware, adminMiddleware, async (req, res) => {
  const connection = await pool.getConnection()
  try {
    const { name, brand, scale, price, description, stock, image, specifications = [] } = req.body

    if (!name || !brand || !scale) {
      return res.status(400).json({ message: 'Заповни назву, бренд і масштаб.' })
    }

    await connection.beginTransaction()
    const [result] = await connection.query(
      'INSERT INTO products (name, brand, scale, price, description, image_url, stock) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        name.trim(),
        brand.trim(),
        scale.trim(),
        Number(price || 0),
        String(description || '').trim(),
        normalizeProductImage(image),
        Number(stock || 0),
      ]
    )

    for (const spec of specifications) {
      if (spec?.name && spec?.value) {
        await connection.query(
          'INSERT INTO product_specs (product_id, spec_name, spec_value) VALUES (?, ?, ?)',
          [result.insertId, String(spec.name).trim(), String(spec.value).trim()]
        )
      }
    }

    await connection.commit()
    res.status(201).json({ message: 'Товар додано.' })
  } catch (error) {
    await connection.rollback()
    res.status(500).json({ message: error.message })
  } finally {
    connection.release()
  }
})

app.put('/api/admin/products/:id', authMiddleware, adminMiddleware, async (req, res) => {
  const connection = await pool.getConnection()
  try {
    const { id } = req.params
    const { name, brand, scale, price, description, stock, image, specifications = [] } = req.body

    if (!name || !brand || !scale) {
      return res.status(400).json({ message: 'Заповни назву, бренд і масштаб.' })
    }

    await connection.beginTransaction()
    await connection.query(
      'UPDATE products SET name = ?, brand = ?, scale = ?, price = ?, description = ?, image_url = ?, stock = ? WHERE id = ?',
      [
        name.trim(),
        brand.trim(),
        scale.trim(),
        Number(price || 0),
        String(description || '').trim(),
        normalizeProductImage(image),
        Number(stock || 0),
        id,
      ]
    )

    await connection.query('DELETE FROM product_specs WHERE product_id = ?', [id])
    for (const spec of specifications) {
      if (spec?.name && spec?.value) {
        await connection.query(
          'INSERT INTO product_specs (product_id, spec_name, spec_value) VALUES (?, ?, ?)',
          [id, String(spec.name).trim(), String(spec.value).trim()]
        )
      }
    }

    await connection.commit()
    res.json({ message: 'Товар оновлено.' })
  } catch (error) {
    await connection.rollback()
    res.status(500).json({ message: error.message })
  } finally {
    connection.release()
  }
})

app.delete('/api/admin/products/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await pool.query('DELETE FROM products WHERE id = ?', [req.params.id])
    res.json({ message: 'Товар видалено.' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

app.get('/api/admin/reviews', authMiddleware, adminMiddleware, async (_req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT r.id, r.product_id, p.name AS product_name, COALESCE(u.name, r.author_name, 'Користувач') AS author,
             r.rating, r.comment, r.created_at
      FROM reviews r
      LEFT JOIN products p ON p.id = r.product_id
      LEFT JOIN users u ON u.id = r.user_id
      ORDER BY r.created_at DESC, r.id DESC
    `)
    res.json(rows)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

app.put('/api/admin/reviews/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { rating, comment } = req.body
    if (!comment || String(comment).trim().length < 5) {
      return res.status(400).json({ message: 'Коментар має бути змістовним.' })
    }
    await pool.query('UPDATE reviews SET rating = ?, comment = ? WHERE id = ?', [Number(rating || 5), String(comment).trim(), req.params.id])
    res.json({ message: 'Відгук оновлено.' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

app.delete('/api/admin/reviews/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await pool.query('DELETE FROM reviews WHERE id = ?', [req.params.id])
    res.json({ message: 'Відгук видалено.' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

ensureSchema()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Backend started on http://localhost:${PORT}`)
    })
  })
  .catch((error) => {
    console.error('Schema init error:', error)
    process.exit(1)
  })
