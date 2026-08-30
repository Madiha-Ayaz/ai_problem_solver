



const functions = require('firebase-functions')
const { defineSecret } = require('firebase-functions/params')
const express = require('express')
const cors = require('cors')
const { notFound, errorHandler } = require('./middleware/errors')

const AI_API_KEY = defineSecret('AI_API_KEY')
const ADMIN_BOOTSTRAP_KEY = defineSecret('ADMIN_BOOTSTRAP_KEY')
const DATABASE_URL = defineSecret('DATABASE_URL')
const FIREBASE_WEB_API_KEY = defineSecret('FIREBASE_WEB_API_KEY')

function createApp() {
  const app = express()

  app.use(cors({ origin: true }))
  app.use(express.json())

  app.get('/api/health', (req, res) => {
    res.json({ ok: true, service: 'supportflow-api', time: new Date().toISOString() })
  })

  app.use('/api/auth', require('./routes/auth.routes'))
  app.use('/api/tickets', require('./routes/tickets.routes'))
  app.use('/api/tickets', require('./routes/messages.routes'))
  app.use('/api/agent/tickets', require('./routes/agent.routes'))
  app.use('/api/ai', require('./routes/ai.routes'))
  app.use('/api/admin', require('./routes/admin.routes'))
  app.use('/api/dashboard', require('./routes/dashboard.routes'))

  app.use(notFound)
  app.use(errorHandler)

  return app
}

const app = createApp()

exports.createApp = createApp
exports.app = app

const runtimeOpts = {
  secrets: [
    AI_API_KEY,
    ADMIN_BOOTSTRAP_KEY,
    DATABASE_URL,
    FIREBASE_WEB_API_KEY,
  ],
}

exports.api = functions.region('us-central1').runWith(runtimeOpts).https.onRequest(app)

exports.onTicketStatusChanged = require('./triggers/realtime').onTicketStatusChanged
exports.onMessageCreated = require('./triggers/realtime').onMessageCreated