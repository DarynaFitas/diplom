import pg from 'pg'
import dotenv from 'dotenv'

dotenv.config()

const { Pool } = pg

// pg returns DECIMAL as string by default — parse to number to match mysql2 behavior.
pg.types.setTypeParser(1700, (val) => (val === null ? null : Number(val)))
// BIGINT → Number (safe for our non-astronomical IDs)
pg.types.setTypeParser(20, (val) => (val === null ? null : Number(val)))

const useConnectionString = Boolean(process.env.PG_URL || process.env.DATABASE_URL)

const raw = new Pool(
  useConnectionString
    ? {
        connectionString: process.env.PG_URL || process.env.DATABASE_URL,
        ssl:
          (process.env.PG_SSL || '').toLowerCase() === 'false'
            ? false
            : { rejectUnauthorized: false },
      }
    : {
        host: process.env.PG_HOST || 'localhost',
        port: Number(process.env.PG_PORT || 5432),
        user: process.env.PG_USER || 'postgres',
        password: process.env.PG_PASSWORD || '',
        database: process.env.PG_DATABASE || 'carmodel_shop',
        max: 10,
      }
)

function normalizePlaceholders(sql) {
  let i = 0
  return sql.replace(/\?/g, () => `$${++i}`)
}

function sanitizeParams(params) {
  if (!params) return []
  return params.map((p) => (p === undefined ? null : p))
}

// Return shape that matches mysql2's `[rows, fields]` tuple so the existing
// code that uses `const [rows] = await pool.query(...)` keeps working.
async function runQuery(executor, sql, params) {
  const result = await executor.query(normalizePlaceholders(sql), sanitizeParams(params))
  return [result.rows || [], result.fields || []]
}

export const pool = {
  async query(sql, params) {
    return runQuery(raw, sql, params)
  },
  async getConnection() {
    const client = await raw.connect()
    return {
      query: (sql, params) => runQuery(client, sql, params),
      async beginTransaction() { await client.query('BEGIN') },
      async commit() { await client.query('COMMIT') },
      async rollback() { await client.query('ROLLBACK') },
      release() { client.release() },
    }
  },
}
