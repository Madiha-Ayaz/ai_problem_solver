





const admin = require('firebase-admin')
const { Firestore } = require('@google-cloud/firestore')
const fs = require('fs')
const path = require('path')

function loadCredentials() {
  // 1. Explicit GOOGLE_APPLICATION_CREDENTIALS (set by EC2 systemd/pm2)
  const fromEnv = process.env.GOOGLE_APPLICATION_CREDENTIALS
  if (fromEnv && fs.existsSync(fromEnv)) {
    return JSON.parse(fs.readFileSync(fromEnv, 'utf8'))
  }
  // 2. Local repo copy used for AWS deploy
  const local = path.join(__dirname, '..', 'service-account.json')
  if (fs.existsSync(local)) {
    return JSON.parse(fs.readFileSync(local, 'utf8'))
  }
  return null // fall back to ADC (emulator / GCP)
}

if (admin.apps.length === 0) {
  const creds = loadCredentials()
  if (creds) {
    admin.initializeApp({ credential: admin.credential.cert(creds) })
  } else {
    admin.initializeApp()
  }
}

const db = admin.firestore()




const FieldValue = Firestore.FieldValue
const Timestamp = admin.firestore.Timestamp

module.exports = { admin, db, FieldValue, Timestamp }