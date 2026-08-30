











const { db, FieldValue } = require('../config/firebase')
const neonMirror = require('./neon/mirror')
const {
  TICKET_STATUSES,
  STATUSES,
  TICKET_FLOW,
  TICKET_NUMBER_PREFIX,
  TICKET_NUMBER_SEQ,
} = require('../constants/ticket')

const ticketsRef = () => db.collection('tickets')
const countersRef = () => db.collection('counters')

function now() {
  return FieldValue.serverTimestamp()
}

async function nextTicketNumber(tx) {
  const ref = countersRef().doc(TICKET_NUMBER_SEQ)
  const snap = await tx.get(ref)
  const next = (snap.exists ? snap.data().value : 0) + 1
  tx.set(ref, { value: next }, { merge: true })
  return `${TICKET_NUMBER_PREFIX}-${String(next).padStart(6, '0')}`
}

const toTicket = (snap) => {
  if (!snap.exists) return null
  const data = snap.data()
  for (const key of ['createdAt', 'updatedAt', 'resolvedAt']) {
    if (data[key] && typeof data[key].toDate === 'function') {
      data[key] = data[key].toDate().toISOString()
    }
  }
  return { id: snap.id, ...data }
}

const toTicketList = (snap) =>
  snap.docs.filter((d) => d.exists).map((d) => toTicket(d)).filter(Boolean)

async function createTicket({
  subject,
  description,
  category,
  priority,
  summary,
  recommendation,
  customerId,
  aiSuggestion = null,
  aiReviewed = false,
}) {
const data = {
    subject: subject || '',
    description: description || '',
    category: category || '',
    priority: priority || '',
    summary: summary || '',
    recommendation: recommendation || '',
    status: TICKET_STATUSES.NEW,
    customerId,
    assignedAgentId: null,
    aiSuggestion,
    aiReviewed,
    resolutionNote: null,
    createdAt: now(),
    updatedAt: now(),
    resolvedAt: null,
  }
const outcome = await db.runTransaction(async (tx) => {
    const ticketNumber = await nextTicketNumber(tx)
    const ref = ticketsRef().doc()
    tx.set(ref, { ...data, ticketNumber })
    return { id: ref.id, ticketNumber }
  })
  const fresh = await getTicket(outcome.id)
  if (fresh) await neonMirror.upsertTicket(fresh)
  return outcome
}

async function getTicket(ticketId) {
  const snap = await ticketsRef().doc(ticketId).get()
  return toTicket(snap)
}

async function listCustomerTickets(customerId, { limit = 50 } = {}) {
  const snap = await ticketsRef()
    .where('customerId', '==', customerId)
    .orderBy('createdAt', 'desc')
    .limit(Math.min(limit, 100))
    .get()
  return toTicketList(snap)
}



async function listAgentTickets(agentUid, { scope, status, limit = 50 } = {}) {
  let query = ticketsRef()
  if (scope === 'pool') {
    query = query.where('status', '==', TICKET_STATUSES.NEW)
  } else {
    query = query.where('assignedAgentId', '==', agentUid)
    if (status && STATUSES.includes(status)) {
      query = query.where('status', '==', status)
    }
  }
  const snap = await query.orderBy('createdAt', 'desc').limit(Math.min(limit, 100)).get()
  return toTicketList(snap)
}

function assertValidTransition(currentStatus, nextStatus) {
  if (currentStatus === nextStatus) return
  const allowed = TICKET_FLOW[currentStatus] || []
  if (!allowed.includes(nextStatus)) {
    const err = new Error(`Cannot change status from ${currentStatus} to ${nextStatus}`)
    err.status = 409
    err.code = 'INVALID_STATUS_TRANSITION'
    throw err
  }
}


async function updateTicket(ticketId, patch, { currentStatus } = {}) {
  const updates = { ...patch, updatedAt: now() }
  if (patch.status) {
    assertValidTransition(currentStatus, patch.status)
    
    if (currentStatus === TICKET_STATUSES.RESOLVED && patch.status !== TICKET_STATUSES.RESOLVED) {
      updates.resolvedAt = FieldValue.delete()
    }
  }
await ticketsRef().doc(ticketId).update(updates)
  const updated = await getTicket(ticketId)
  if (updated) await neonMirror.upsertTicket(updated)
  return updated
}


async function resolveTicket(ticketId, resolutionNote, { currentStatus } = {}) {
  assertValidTransition(currentStatus, TICKET_STATUSES.RESOLVED)
  const updates = {
    status: TICKET_STATUSES.RESOLVED,
    resolutionNote,
    resolvedAt: now(),
    updatedAt: now(),
  }
  await ticketsRef().doc(ticketId).update(updates)
  const updated = await getTicket(ticketId)
  if (updated) await neonMirror.upsertTicket(updated)
  return updated
}


function ticketTokens(text) {
  return [...new Set(
    String(text || '')
      .toLowerCase()
      .replace(/[^a-z0-9\s]/gi, ' ')
      .split(/\s+/)
      .filter((w) => w.length >= 4 && !/^\d+$/.test(w))
  )].slice(0, 80)
}





async function findSimilarTickets({ category, subject, description, excludeId, limit = 200, top = 3 } = {}) {
  const needle = ticketTokens(`${subject || ''} ${description || ''}`)
  if (!needle.length) return []

  const snap = await ticketsRef()
    .orderBy('createdAt', 'desc')
    .limit(Math.min(limit, 400))
    .get()

  const scored = []
  for (const doc of snap.docs) {
    if (!doc.exists) continue
    if (excludeId && doc.id === excludeId) continue
    const d = doc.data()
    if (d.status === TICKET_STATUSES.RESOLVED) continue
    const hay = ticketTokens(`${d.subject || ''} ${d.description || ''}`)
    if (!hay.length) continue

    const shared = hay.filter((w) => needle.includes(w)).length
    const union = new Set([...needle, ...hay]).size || 1
    const jaccard = shared / union
    const sameCategory = Boolean(category && d.category === category)

    if (sameCategory && shared >= 1) {
      scored.push({ score: 100 + shared * 5 + jaccard * 40, id: doc.id, data: d })
    } else if (jaccard >= 0.2) {
      scored.push({ score: 40 + jaccard * 60, id: doc.id, data: d })
    }
  }

  scored.sort((a, b) => b.score - a.score)
  return scored.slice(0, top).map(({ id, data }) => ({
    id,
    ticketNumber: data.ticketNumber,
    subject: data.subject,
    status: data.status,
    category: data.category,
  }))
}

module.exports = {
  createTicket,
  getTicket,
  listCustomerTickets,
  listAgentTickets,
  updateTicket,
  resolveTicket,
  assertValidTransition,
  findSimilarTickets,
}

