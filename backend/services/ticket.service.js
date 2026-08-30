





const ticketModel = require('../models/ticket.model')
const neonMirror = require('../models/neon/mirror')
const aiService = require('./ai.service')
const { AppError } = require('../middleware/errors')
const { PRIORITIES, CATEGORIES, TICKET_STATUSES } = require('../constants/ticket')

const TICKET_PATCH_FIELDS = ['status', 'priority', 'category', 'summary', 'recommendation', 'assignedAgentId']




const AI_CREATE_BUDGET_MS = 10000
const AI_CREATE_MAX_RETRIES = 2
const AI_CREATE_BACKOFF_MS = [1500, 2500]

async function createTicket(uid, input) {
  
  const data = {
    ...input,
    customerId: uid,
  }

  let suggestion = null
  try {
    suggestion = await aiService.triage(
      { subject: data.subject, description: data.description },
      {
        useNetwork: true,
        timeoutMs: AI_CREATE_BUDGET_MS,
        maxRetries: AI_CREATE_MAX_RETRIES,
        backoffMs: AI_CREATE_BACKOFF_MS,
      }
    )
  } catch (e) {
    
    suggestion = null
    console.warn('[AI] triage unavailable during ticket creation:', (e && e.code) || 'unknown')
  }

  if (suggestion) {
    
    data.category = data.category || suggestion.category
    data.priority = data.priority || suggestion.priority
    data.summary = data.summary || suggestion.summary
    data.recommendation = data.recommendation || suggestion.recommendation
  }

  const created = await ticketModel.createTicket({
    ...data,
    aiSuggestion: suggestion,
    aiReviewed: false,
  })
  return { ...created, suggestion }
}

async function listCustomerTickets(uid, query) {
  const limit = parseInt(query.limit, 10) || 50
  return ticketModel.listCustomerTickets(uid, { limit })
}



async function listAgentTickets(uid, query) {
  const limit = parseInt(query.limit, 10) || 50
  const scope = query.scope === 'pool' ? 'pool' : undefined
  const status = query.status
  const neonTickets = await neonMirror.listAgentTickets(uid, { scope, status, limit })
  if (neonTickets) return neonTickets
  return ticketModel.listAgentTickets(uid, { scope, status, limit })
}

async function getTicket(ticketId) {
  const ticket = await ticketModel.getTicket(ticketId)
  if (!ticket) throw new AppError(404, 'Ticket not found', 'TICKET_NOT_FOUND')
  return ticket
}

function pick(patch) {
  const out = {}
  for (const key of TICKET_PATCH_FIELDS) {
    if (patch[key] !== undefined) out[key] = patch[key]
  }
  if (patch.status === undefined && Object.keys(out).length === 0) {
    throw new AppError(400, 'Nothing to update', 'EMPTY_PATCH')
  }
  return out
}

async function updateTicketByAgent(ticketId, patch, actorUid) {
  const ticket = await getTicket(ticketId)
  const updates = pick(patch)

  
  
  
  if (
    updates.category !== undefined ||
    updates.priority !== undefined ||
    updates.summary !== undefined ||
    updates.recommendation !== undefined
  ) {
    updates.aiReviewed = true
  }

  if (updates.assignedAgentId !== undefined) {
    
    if (updates.assignedAgentId !== actorUid) {
      throw new AppError(403, 'You can only assign tickets to yourself', 'ASSIGN_FORBIDDEN')
    }
    
    if (ticket.status === 'NEW' && updates.status === undefined) {
      updates.status = 'ASSIGNED'
    }
  }

  const updated = await ticketModel.updateTicket(ticketId, updates, { currentStatus: ticket.status })
  return updated
}

async function resolveTicket(ticketId, resolutionNote, actorUid) {
  const ticket = await getTicket(ticketId)
  if (ticket.status === 'RESOLVED') {
    throw new AppError(409, 'Ticket is already resolved', 'ALREADY_RESOLVED')
  }
  const updated = await ticketModel.resolveTicket(ticketId, resolutionNote, {
    currentStatus: ticket.status,
  })
  return updated
}



async function reopenTicket(ticketId) {
  const ticket = await getTicket(ticketId)
  if (ticket.status !== TICKET_STATUSES.RESOLVED) {
    throw new AppError(409, 'Only resolved tickets can be reopened', 'NOT_RESOLVED')
  }
  const updated = await ticketModel.updateTicket(
    ticketId,
    { status: TICKET_STATUSES.IN_PROGRESS },
    { currentStatus: ticket.status }
  )
  return updated
}


async function similarTickets(ticketId) {
  const ticket = await getTicket(ticketId)
  return ticketModel.findSimilarTickets({
    category: ticket.category,
    subject: ticket.subject,
    description: ticket.description,
    excludeId: ticketId,
  })
}

module.exports = {
  createTicket,
  listCustomerTickets,
  listAgentTickets,
  getTicket,
  updateTicketByAgent,
  resolveTicket,
  reopenTicket,
  similarTickets,
  PRIORITIES,
  CATEGORIES,
}