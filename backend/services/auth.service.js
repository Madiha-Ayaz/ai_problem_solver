





const { admin } = require('../config/firebase')
const { FIREBASE_WEB_API_KEY } = require('../config/env')
const { createUser, getUser, updateUser } = require('../models/user.model')
const { AppError } = require('../middleware/errors')
const { ROLES } = require('../constants/ticket')

const IDENTITY_TOOLKIT_URL =
  'https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword'

async function register({ name, email, password }) {
  let userRecord
  try {
    userRecord = await admin.auth().createUser({ email, password, displayName: name })
  } catch (e) {
    if (e.code === 'auth/email-already-exists') {
      throw new AppError(409, 'An account with this email already exists', 'EMAIL_EXISTS')
    }
    throw new AppError(400, 'Could not register account', 'REGISTER_FAILED')
  }

  try {
    await admin.auth().setCustomUserClaims(userRecord.uid, { role: ROLES.CUSTOMER })
    await createUser({
      uid: userRecord.uid,
      name,
      email,
      role: ROLES.CUSTOMER,
      provider: 'email',
    })
  } catch (e) {
    await admin.auth().deleteUser(userRecord.uid).catch(() => {})
    throw new AppError(500, 'Could not finish registration', 'REGISTER_FAILED')
  }

  return { uid: userRecord.uid, name, email, role: ROLES.CUSTOMER }
}

async function login({ email, password }) {
  if (!FIREBASE_WEB_API_KEY) {
    throw new AppError(
      501,
      '/api/auth/login requires FIREBASE_WEB_API_KEY on the server',
      'LOGIN_UNAVAILABLE'
    )
  }

  const resp = await fetch(`${IDENTITY_TOOLKIT_URL}?key=${FIREBASE_WEB_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, returnSecureToken: true }),
  })

  if (!resp.ok) {
    const body = await resp.json().catch(() => null)
    const msg = body && body.error && body.error.message
    if (msg === 'EMAIL_NOT_FOUND' || msg === 'INVALID_PASSWORD') {
      throw new AppError(401, 'Invalid email or password', 'INVALID_CREDENTIALS')
    }
    throw new AppError(401, 'Sign in failed', 'LOGIN_FAILED')
  }

  const data = await resp.json()
  let role = ROLES.CUSTOMER
  try {
    const u = await admin.auth().getUser(data.localId)
    role = (u.customClaims && u.customClaims.role) || role
  } catch (e) {
    
  }

  return {
    uid: data.localId,
    email: data.email || email,
    role,
    idToken: data.idToken,
    refreshToken: data.refreshToken,
    expiresIn: data.expiresIn,
  }
}

async function logout(uid) {
  await admin.auth().revokeRefreshTokens(uid)
  return { ok: true }
}

async function me(uid) {
  const user = await admin.auth().getUser(uid)
  const claimRole = user.customClaims && user.customClaims.role
  const profile = await getUser(uid)
  const role = claimRole || (profile && profile.role) || ROLES.CUSTOMER
  return {
    uid,
    email: user.email || null,
    name: (profile && profile.name) || user.displayName || '',
    role,
    isActive: profile ? profile.isActive : true,
    provider: profile ? profile.provider : null,
  }
}








const VALID_ROLES = [ROLES.CUSTOMER, ROLES.AGENT, ROLES.ADMIN]

async function syncRole(uid, requestedRole) {
  let claimRole = null
  try {
    const userRecord = await admin.auth().getUser(uid)
    claimRole = (userRecord.customClaims && userRecord.customClaims.role) || null
  } catch (e) {
    
  }

  const profile = await getUser(uid)
  const existingRole = claimRole || (profile && profile.role) || null
  const role = VALID_ROLES.includes(requestedRole)
    ? requestedRole
    : existingRole || ROLES.CUSTOMER

  await admin.auth().setCustomUserClaims(uid, { role }).catch(() => {})
  await updateUser(uid, { role, isActive: profile ? profile.isActive : true }).catch(() => {})
  return { ok: true, role }
}

module.exports = { register, login, logout, me, syncRole }