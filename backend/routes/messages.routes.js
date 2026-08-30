





const { Router } = require('express')
const { requireAuth } = require('../middleware/auth')
const { requireTicketParticipant } = require('../middleware/rbac')
const { validate } = require('../middleware/validate')
const { asyncHandler } = require('../middleware/errors')
const messageService = require('../services/message.service')

const router = Router()

const messageSchema = {
  message: { required: true, type: 'string', min: 1, max: 2000 },
}

router.get(
  '/:id/messages',
  requireAuth,
  requireTicketParticipant,
  asyncHandler(async (req, res) => {
    const messages = await messageService.listMessages(req.params.id, req.query)
    res.json({ messages })
  })
)

router.post(
  '/:id/messages',
  requireAuth,
  validate(messageSchema),
  requireTicketParticipant,
  asyncHandler(async (req, res) => {
    const message = await messageService.sendMessage({
      ticketId: req.params.id,
      senderId: req.user.uid,
      senderRole: req.user.role || null,
      autoClaim: !!req.isPoolAgent,
      message: req.body.message,
    })
    res.status(201).json({ message })
  })
)

module.exports = router