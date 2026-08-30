





const { Router } = require('express')
const { requireAuth } = require('../middleware/auth')
const { validate } = require('../middleware/validate')
const { asyncHandler } = require('../middleware/errors')
const aiService = require('../services/ai.service')
const { PRIORITIES, CATEGORIES } = require('../constants/ticket')

const router = Router()

const triageSchema = {
  subject: { required: true, type: 'string', min: 5, max: 200 },
  description: { required: true, type: 'string', min: 10, max: 5000 },
  category: { type: 'string', enum: CATEGORIES },
  priority: { type: 'string', enum: PRIORITIES },
}

router.post(
  '/triage',
  requireAuth,
  validate(triageSchema),
  asyncHandler(async (req, res) => {
    const suggestion = await aiService.triage(req.body)
    res.json({ suggestion })
  })
)

module.exports = router