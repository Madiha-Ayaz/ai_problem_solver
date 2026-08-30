




class AppError extends Error {
  constructor(status, message, code = 'ERROR', details) {
    super(message)
    this.name = 'AppError'
    this.status = status
    this.code = code
    this.details = details
  }
}

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next)

const notFound = (req, res) => {
  res.status(404).json({ error: 'Route not found', code: 'NOT_FOUND' })
}

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  const status = err.status || (err.code && err.code.startsWith('auth/') ? 400 : 500)
  if (status >= 500) {
    console.error('[SupportFlow-API]', err)
  }
  res.status(status).json({
    error: err.message || 'Internal server error',
    code: err.code || 'INTERNAL',
    details: err.details,
  })
}

module.exports = { AppError, asyncHandler, notFound, errorHandler }