












const { Router } = require('express')
const { requireAuth } = require('../middleware/auth')
const { requireAdmin } = require('../middleware/rbac')
const { validate } = require('../middleware/validate')
const { asyncHandler, AppError } = require('../middleware/errors')
const adminService = require('../services/admin.service')
const ticketService = require('../services/ticket.service')
const neonMirror = require('../models/neon/mirror')
const { ROLES, STATUSES } = require('../constants/ticket')

const router = Router()

const ROLE_VALUES = [ROLES.CUSTOMER, ROLES.AGENT, ROLES.ADMIN]

router.post(
  '/bootstrap',
  requireAuth,
  validate({ key: { required: true, type: 'string', min: 8, max: 128 } }),
  asyncHandler(async (req, res) => {
    const user = await adminService.bootstrap(req.user.uid, req.body)
    res.status(201).json({ user })
  })
)

router.get(
  '/stats',
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const stats = await adminService.stats()
    res.json({ stats })
  })
)

router.get(
  '/users',
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const role = req.query.role
    if (role && !ROLE_VALUES.includes(role)) {
      throw new AppError(400, 'Invalid role filter', 'VALIDATION_ERROR')
    }
    const users = await adminService.users({ role })
    res.json({ users })
  })
)


router.get(
  '/agents/overview',
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const agents = await adminService.agentsOverview()
    res.json({ agents })
  })
)

router.get(
  '/tickets',
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const status = req.query.status
    if (status && !STATUSES.includes(status)) {
      throw new AppError(400, 'Invalid status filter', 'VALIDATION_ERROR')
    }
    let limit = parseInt(req.query.limit, 10) || 50
    limit = Math.min(Math.max(limit, 1), 200)
    const tickets = await adminService.allTickets({ status, limit })
    res.json({ tickets })
  })
)

router.get(
  '/tickets/:id',
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const ticket = await adminService.getTicket(req.params.id)
    res.json({ ticket })
  })
)


router.get(
  '/tickets/:id/similar',
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const similar = await ticketService.similarTickets(req.params.id)
    res.json({ similar })
  })
)

router.get(
  '/users/:uid',
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const user = await adminService.getUserInfo(req.params.uid)
    res.json({ user })
  })
)

router.get(
  '/users/:uid/tickets',
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const tickets = await adminService.userTickets(req.params.uid)
    res.json({ tickets })
  })
)

router.patch(
  '/users/:uid',
  requireAuth,
  requireAdmin,
  validate({ role: { type: 'string', enum: ROLE_VALUES }, isActive: { type: 'boolean' } }),
  asyncHandler(async (req, res) => {
    const user = await adminService.setUserRole(req.user.uid, req.params.uid, req.body)
    res.json({ user })
  })
)


router.get(
  '/neon',
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const data = await neonMirror.getOverview()
    res.json(data)
  })
)


router.post(
  '/neon/sync',
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const result = await neonMirror.syncAll()
    res.json(result)
  })
)

module.exports = router