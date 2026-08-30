






const { admin, db } = require('../config/firebase')
const { AppError, asyncHandler } = require('./errors')
const { ROLES } = require('../constants/ticket')
const { getUser } = require('../models/user.model')

async function resolveRole(uid) {
  try {
    const user = await admin.auth().getUser(uid)
    const claim = user.customClaims && user.customClaims.role
    if (claim) return claim
  } catch (e) {
    
  }
  const profile = await getUser(uid)
  return profile && profile.role ? profile.role : null
}

const requireRole = (...roles) =>
  asyncHandler(async (req, res, next) => {
    const role = await resolveRole(req.user.uid)
    if (!roles.includes(role)) {
      throw new AppError(403, 'Forbidden: insufficient permissions', 'FORBIDDEN')
    }
    req.user.role = role
    next()
  })

const requireCustomer = requireRole(ROLES.CUSTOMER)
const requireAgent = requireRole(ROLES.AGENT)
const requireAdmin = requireRole(ROLES.ADMIN)

async function getTicketOr404(ticketId) {
  const snap = await db.collection('tickets').doc(ticketId).get()
  if (!snap.exists) {
    throw new AppError(404, 'Ticket not found', 'TICKET_NOT_FOUND')
  }
  return { id: snap.id, ...snap.data() }
}


const requireTicketOwner = asyncHandler(async (req, res, next) => {
  const ticket = await getTicketOr404(req.params.id)
  if (ticket.customerId !== req.user.uid) {
    throw new AppError(403, 'You can only access your own tickets', 'TICKET_FORBIDDEN')
  }
  req.ticket = ticket
  next()
})





const requireTicketParticipant = asyncHandler(async (req, res, next) => {
  if (!req.user.role) {
    req.user.role = await resolveRole(req.user.uid)
  }
  const ticket = await getTicketOr404(req.params.id)
  const isOwner = ticket.customerId === req.user.uid
  const isAssigned = req.user.role === ROLES.AGENT && ticket.assignedAgentId === req.user.uid
  const isPoolAgent = req.user.role === ROLES.AGENT && ticket.status === 'NEW' && !ticket.assignedAgentId
  const isAdmin = req.user.role === ROLES.ADMIN
  if (!isOwner && !isAssigned && !isPoolAgent && !isAdmin) {
    throw new AppError(403, 'You are not a participant on this ticket', 'TICKET_FORBIDDEN')
  }
  req.ticket = ticket
  req.isPoolAgent = isPoolAgent
  next()
})


const requireAssignedAgent = asyncHandler(async (req, res, next) => {
  const ticket = await getTicketOr404(req.params.id)
  const isAssigned = ticket.assignedAgentId === req.user.uid
  const isClaimable = ticket.status === 'NEW'
  if (!isAssigned && !isClaimable) {
    throw new AppError(403, 'Ticket is assigned to another agent', 'TICKET_FORBIDDEN')
  }
  req.ticket = ticket
  next()
})

module.exports = {
  resolveRole,
  requireRole,
  requireCustomer,
  requireAgent,
  requireAdmin,
  requireTicketOwner,
  requireTicketParticipant,
  requireAssignedAgent,
}