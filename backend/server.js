/**
 * AWS EC2 entry point — plain Express HTTP server.
 * Reuses the same `createApp()` from index.js (all routes) but runs as a
 * standard Node HTTP server instead of a Firebase Cloud Function.
 *
 * Required env (from backend/.env):
 *   PORT                (default 8080)
 *   GOOGLE_APPLICATION_CREDENTIALS  (path to Firebase service-account.json)
 *   FIREBASE_WEB_API_KEY (used by /api/auth/login via identitytoolkit)
 *   ADMIN_BOOTSTRAP_KEY
 *   AI_API_KEY, AI_BASE_URL, AI_MODEL
 *   DATABASE_URL (Neon)
 */
const { createApp } = require('./index')

const port = parseInt(process.env.PORT || '8080', 10)

const app = createApp()

const server = app.listen(port, () => {
  console.log(`[SupportFlow-API] listening on http://0.0.0.0:${port}`)
})

process.on('SIGTERM', () => server.close(() => process.exit(0)))
process.on('SIGINT', () => server.close(() => process.exit(0)))
