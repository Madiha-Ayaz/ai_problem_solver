












const { AppError } = require('./errors')

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function checkField(field, spec, value) {
  const label = spec.label || field

  if (value === undefined || value === null || value === '') {
    if (spec.required) return { field, message: `${label} is required` }
    return null
  }
  if (typeof value !== spec.type) {
    return { field, message: `${label} must be a ${spec.type}` }
  }
  if (spec.type === 'string') {
    const len = value.trim().length
    if (spec.min != null && len < spec.min) {
      return { field, message: `${label} must be at least ${spec.min} characters` }
    }
    if (spec.max != null && len > spec.max) {
      return { field, message: `${label} must be at most ${spec.max} characters` }
    }
    if (spec.pattern && !spec.pattern.test(value.trim())) {
      return { field, message: `${label} is not in a valid format` }
    }
  }
  if (spec.enum && !spec.enum.includes(value)) {
    return { field, message: `${label} must be one of: ${spec.enum.join(', ')}` }
  }
  return null
}

const validate = (schema, { source = 'body' } = {}) => (req, res, next) => {
  const data = req[source] || {}
  const errors = []
  for (const [field, spec] of Object.entries(schema)) {
    const err = checkField(field, spec, data[field])
    if (err) errors.push(err)
  }
  if (errors.length) {
    return next(new AppError(400, 'Validation failed', 'VALIDATION_ERROR', errors))
  }
  next()
}

module.exports = { validate, EMAIL_RE }