






const { Router } = require('express')
const { validate, EMAIL_RE } = require('../middleware/validate')
const { requireAuth } = require('../middleware/auth')
const { asyncHandler } = require('../middleware/errors')
const authService = require('../services/auth.service')
const { ROLES } = require('../constants/ticket')

const router = Router()

const ROLE_VALUES = [ROLES.CUSTOMER, ROLES.AGENT, ROLES.ADMIN]

const registerSchema = {
  name: { required: true, type: 'string', min: 2, max: 80 },
  email: { required: true, type: 'string', pattern: EMAIL_RE, max: 254 },
  password: { required: true, type: 'string', min: 6, max: 128 },
}

const loginSchema = {
  email: { required: true, type: 'string', pattern: EMAIL_RE, max: 254 },
  password: { required: true, type: 'string', min: 6, max: 128 },
}

router.post(
  '/register',
  validate(registerSchema),
  asyncHandler(async (req, res) => {
    const user = await authService.register(req.body)
    res.status(201).json({ user })
  })
)

router.post(
  '/login',
  validate(loginSchema),
  asyncHandler(async (req, res) => {
    const session = await authService.login(req.body)
    res.json({ ...session })
  })
)

router.post(
  '/logout',
  requireAuth,
  asyncHandler(async (req, res) => {
    const result = await authService.logout(req.user.uid)
    res.json(result)
  })
)

router.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await authService.me(req.user.uid)
    res.json({ user })
  })
)

router.post(
  '/sync',
  requireAuth,
  validate({ role: { type: 'string', enum: ROLE_VALUES } }),
  asyncHandler(async (req, res) => {
    const result = await authService.syncRole(req.user.uid, req.body.role)
    res.json(result)
  })
)

module.exports = router