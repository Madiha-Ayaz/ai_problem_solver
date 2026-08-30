





const { admin } = require('../config/firebase')
const { AppError, asyncHandler } = require('./errors')

const requireAuth = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : null

  if (!token) {
    throw new AppError(401, 'Authentication required', 'AUTH_REQUIRED')
  }

  try {
    
    const decoded = await admin.auth().verifyIdToken(token, true)
    req.user = {
      uid: decoded.uid,
      email: decoded.email || null,
    }
    next()
  } catch (e) {
    if (e.code === 'auth/id-token-revoked') {
      throw new AppError(401, 'Session revoked, please sign in again', 'SESSION_REVOKED')
    }
    throw new AppError(401, 'Invalid or expired session', 'INVALID_TOKEN')
  }
})

module.exports = { requireAuth }