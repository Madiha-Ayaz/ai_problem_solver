





const { Router } = require('express')
const { requireAuth } = require('../middleware/auth')
const { requireCustomer, requireAgent } = require('../middleware/rbac')
const { asyncHandler } = require('../middleware/errors')
const dashboardService = require('../services/dashboard.service')

const router = Router()

router.get(
  '/customer',
  requireAuth,
  requireCustomer,
  asyncHandler(async (req, res) => {
    const stats = await dashboardService.customerDashboard(req.user.uid)
    res.json({ stats })
  })
)

router.get(
  '/agent',
  requireAuth,
  requireAgent,
  asyncHandler(async (req, res) => {
    const stats = await dashboardService.agentDashboard(req.user.uid)
    res.json({ stats })
  })
)

module.exports = router