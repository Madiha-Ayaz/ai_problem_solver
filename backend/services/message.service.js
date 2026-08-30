





const messageModel = require('../models/message.model')
const ticketModel = require('../models/ticket.model')
const { getUser } = require('../models/user.model')
const aiService = require('./ai.service')
const { TICKET_STATUSES, TICKET_FLOW } = require('../constants/ticket')
const { AppError } = require('../middleware/errors')

const AI_REPLY_BUDGET_MS = 30000
const AI_REPLY_MAX_RETRIES = 3
const AI_REPLY_BACKOFF_MS = [2000, 4000, 8000]

async function listMessages(ticketId, query) {
  const limit = parseInt(query.limit, 10) || 200
  const messages = await messageModel.listMessages(ticketId, { limit })

  
  const senderIds = [...new Set(messages.map((m) => m.senderId).filter(Boolean))]
  const profiles = await Promise.all(senderIds.map((uid) => getUser(uid).catch(() => null)))
  const byUid = {}
  senderIds.forEach((uid, i) => {
    byUid[uid] = profiles[i]
  })

  return messages.map((m) => {
    
    
    if (m.senderId === aiService.AI_SENDER_ID || m.senderRole === 'ai') {
      return {
        ...m,
        authorName: aiService.AI_SENDER_NAME,
        authorRole: 'ai',
        senderRole: 'ai',
      }
    }
    const profile = byUid[m.senderId]
    return {
      ...m,
      authorName: (profile && (profile.name || profile.email)) || '',
      authorRole: (profile && profile.role) || null,
    }
  })
}





async function applyAiStatus(ticketId, ticket, status) {
  if (!status || status === 'KEEP' || status === TICKET_STATUSES.RESOLVED) return
  const current = (await ticketModel.getTicket(ticketId)) || ticket
  if (!current) return
  const cur = current.status
  const allowed = (TICKET_FLOW[cur] || [])
  if (!allowed.includes(status)) return
  const patch = { status }
  if (status === TICKET_STATUSES.NEW) {
    
    patch.assignedAgentId = null
  }
  
  
  
  if (status === TICKET_STATUSES.ASSIGNED && !current.assignedAgentId) return
  await ticketModel.updateTicket(ticketId, patch, { currentStatus: cur })
}

async function addAiReply({ ticketId, ticket }) {
  const history = await messageModel.listMessages(ticketId, { limit: 10 })
  const { reply, resolved, status } = await aiService.answerChat({
    subject: ticket.subject,
    description: ticket.description,
    category: ticket.category,
    history,
  }, {
    timeoutMs: AI_REPLY_BUDGET_MS,
    maxRetries: AI_REPLY_MAX_RETRIES,
    backoffMs: AI_REPLY_BACKOFF_MS,
  })
  const created = reply
    ? await messageModel.createMessage({
        ticketId,
        senderId: aiService.AI_SENDER_ID,
        senderRole: 'ai',
        authorName: aiService.AI_SENDER_NAME,
        message: reply,
      })
    : null

  
  
  
  try {
    if (created && (status || resolved)) {
      if (status && status !== 'KEEP' && status !== TICKET_STATUSES.RESOLVED) {
        await applyAiStatus(ticketId, ticket, status)
      }
      if (resolved && ticket.status !== TICKET_STATUSES.RESOLVED) {
        const currentStatus = (await ticketModel.getTicket(ticketId))?.status || ticket.status
        await ticketModel.resolveTicket(ticketId, 'Resolved automatically by the SupportFlow assistant.', { currentStatus })
      }
    }
  } catch (e) {
    
    console.warn('[AI] auto status change skipped:', (e && e.code) || (e && e.message) || 'unknown')
  }

  return created
}

async function sendMessage({ ticketId, senderId, senderRole = null, autoClaim = false, message }) {
  const ticket = await ticketModel.getTicket(ticketId)
  if (!ticket) {
    throw new AppError(404, 'Ticket not found', 'TICKET_NOT_FOUND')
  }
  
  
  if (ticket.status === TICKET_STATUSES.RESOLVED) {
    throw new AppError(
      409,
      'This ticket is resolved. It must be reopened before new messages can be sent.',
      'TICKET_RESOLVED'
    )
  }

  
  
  
  
  let claimed = null
  if (
    autoClaim &&
    ticket.status === TICKET_STATUSES.NEW &&
    !ticket.assignedAgentId &&
    senderRole === 'agent'
  ) {
    claimed = await ticketModel.updateTicket(
      ticketId,
      { assignedAgentId: senderId, status: TICKET_STATUSES.ASSIGNED },
      { currentStatus: ticket.status }
    )
  }

  const created = await messageModel.createMessage({ ticketId, senderId, message })

  
  
  try {
    if (senderId === ticket.customerId) {
      await addAiReply({ ticketId, ticket })
    }
  } catch (e) {
    
    
    console.warn('[AI] chat reply skipped:', (e && e.code) || 'unknown')
  }

  return { ...created, ticket: claimed }
}

module.exports = { listMessages, sendMessage, addAiReply }