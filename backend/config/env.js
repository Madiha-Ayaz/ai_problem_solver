









const fs = require('fs')
const path = require('path')




try {
  const envPath = path.join(__dirname, '..', '.env')
  if (fs.existsSync(envPath)) {
    for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
      if (!line || line.trim().startsWith('#')) continue
      const eq = line.indexOf('=')
      if (eq === -1) continue
      const key = line.slice(0, eq).trim()
      const val = line.slice(eq + 1).trim().replace(/^["']|["']$/g, '')
      if (key && !(key in process.env)) process.env[key] = val
    }
  }
} catch (e) {
  
}

const FIREBASE_WEB_API_KEY = process.env.FIREBASE_WEB_API_KEY || null
const DATABASE_URL = process.env.DATABASE_URL || null


const ADMIN_BOOTSTRAP_KEY = process.env.ADMIN_BOOTSTRAP_KEY || null
const AI_API_KEY = process.env.AI_API_KEY || null




const AI_BASE_URL = String(process.env.AI_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta/openai').replace(/\/+$/, '')
const AI_MODEL = process.env.AI_MODEL || 'gemini-2.5-flash'
const AI_TIMEOUT_MS = parseInt(process.env.AI_TIMEOUT_MS || '20000', 10)


const AI_CHAT_AUTO_RESOLVE = String(process.env.AI_CHAT_AUTO_RESOLVE || 'true') === 'true'


const SOCKET_SERVER_URL = process.env.SOCKET_SERVER_URL || null
const SOCKET_SECRET = process.env.SOCKET_SECRET || null
const EMAIL_SERVICE_API_KEY = process.env.EMAIL_SERVICE_API_KEY || null
const REDIS_URL = process.env.REDIS_URL || null

module.exports = {
  FIREBASE_WEB_API_KEY,
  DATABASE_URL,
  ADMIN_BOOTSTRAP_KEY,
  AI_API_KEY,
  AI_BASE_URL,
  AI_MODEL,
  AI_TIMEOUT_MS,
  AI_CHAT_AUTO_RESOLVE,
  SOCKET_SERVER_URL,
  SOCKET_SECRET,
  EMAIL_SERVICE_API_KEY,
  REDIS_URL,
}