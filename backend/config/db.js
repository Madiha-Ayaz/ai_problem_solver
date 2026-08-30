






const { Pool } = require('pg')
const { DATABASE_URL } = require('./env')

let pool = null

function getPool() {
  if (!DATABASE_URL) return null
  if (!pool) {
    pool = new Pool({
      connectionString: DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 5,
      connectionTimeoutMillis: 10000,
    })
    
    
    pool.on('error', (err) => {
      console.error('[SupportFlow-Neon] idle client error:', err.message)
    })
  }
  return pool
}


async function query(text, params) {
  const p = getPool()
  if (!p) return { rows: [] }
  try {
    return await p.query(text, params)
  } catch (err) {
    console.error('[SupportFlow-Neon] query failed:', err.message)
    return { rows: [] }
  }
}

module.exports = { getPool, query }
