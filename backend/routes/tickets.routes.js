






const { Router } = require('express')
const { requireAuth } = require('../middleware/auth')
const { requireCustomer, requireTicketOwner } = require('../middleware/rbac')
const { validate } = require('../middleware/validate')
const { asyncHandler } = require('../middleware/errors')
const ticketService = require('../services/ticket.service')

const router = Router()

const ticketSchema = {
  subject: { required: true, type: 'string', min: 5, max: 200 },
  description: { required: true, type: 'string', min: 10, max: 5000 },
  category: { type: 'string', enum: ticketService.CATEGORIES },
  priority: { type: 'string', enum: ticketService.PRIORITIES },
  summary: { type: 'string', max: 300 },
}

router.post(
  '/',
  requireAuth,
  requireCustomer,
  validate(ticketSchema),
  asyncHandler(async (req, res) => {
    const created = await ticketService.createTicket(req.user.uid, req.body)
    res.status(201).json({
      ticketId: created.id,
      ticketNumber: created.ticketNumber,
      suggestion: created.suggestion || null,
    })
  })
)

router.get(
  '/',
  requireAuth,
  requireCustomer,
  asyncHandler(async (req, res) => {
    const tickets = await ticketService.listCustomerTickets(req.user.uid, req.query)
    res.json({ tickets })
  })
)

router.get(
  '/:id',
  requireAuth,
  requireCustomer,
  requireTicketOwner,
  asyncHandler(async (req, res) => {
    const ticket = await ticketService.getTicket(req.params.id)
    res.json({ ticket })
  })
)

module.exports = router