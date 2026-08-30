







const { Router } = require('express')
const { requireAuth } = require('../middleware/auth')
const { requireAgent, requireAssignedAgent } = require('../middleware/rbac')
const { validate } = require('../middleware/validate')
const { asyncHandler, AppError } = require('../middleware/errors')
const ticketService = require('../services/ticket.service')
const { STATUSES, PRIORITIES, CATEGORIES, TICKET_STATUSES } = require('../constants/ticket')

const router = Router()

const patchSchema = {
  status: { type: 'string', enum: STATUSES },
  priority: { type: 'string', enum: PRIORITIES },
  category: { type: 'string', enum: CATEGORIES },
  summary: { type: 'string', max: 300 },
  recommendation: { type: 'string', max: 300 },
  assignedAgentId: { type: 'string' },
}

const resolveSchema = {
  resolutionNote: { required: true, type: 'string', min: 1, max: 4000 },
}

router.get(
  '/',
  requireAuth,
  requireAgent,
  asyncHandler(async (req, res) => {
    const status = req.query.status
    if (status && !STATUSES.includes(status)) {
      throw new AppError(400, 'Invalid status filter', 'VALIDATION_ERROR')
    }
    const tickets = await ticketService.listAgentTickets(req.user.uid, req.query)
    res.json({ tickets })
  })
)


router.get(
  '/:id',
  requireAuth,
  requireAgent,
  asyncHandler(async (req, res) => {
    const ticket = await ticketService.getTicket(req.params.id)
    res.json({ ticket })
  })
)

router.patch(
  '/:id',
  requireAuth,
  requireAgent,
  requireAssignedAgent,
  validate(patchSchema),
  asyncHandler(async (req, res) => {
    const ticket = await ticketService.updateTicketByAgent(req.params.id, req.body, req.user.uid)
    res.json({ ticket })
  })
)

router.post(
  '/:id/resolve',
  requireAuth,
  requireAgent,
  requireAssignedAgent,
  validate(resolveSchema),
  asyncHandler(async (req, res) => {
    const ticket = await ticketService.resolveTicket(req.params.id, req.body.resolutionNote, req.user.uid)
    res.json({ ticket })
  })
)


router.post(
  '/:id/reopen',
  requireAuth,
  requireAgent,
  requireAssignedAgent,
  asyncHandler(async (req, res) => {
    const ticket = await ticketService.reopenTicket(req.params.id)
    res.json({ ticket })
  })
)

module.exports = router