



const { db } = require('../config/firebase')
const { TICKET_STATUSES } = require('../constants/ticket')

const ticketsRef = () => db.collection('tickets')

function serializeTicket(doc) {
  const data = doc.data()
  for (const key of ['createdAt', 'updatedAt', 'resolvedAt']) {
    if (data[key] && typeof data[key].toDate === 'function') {
      data[key] = data[key].toDate().toISOString()
    }
  }
  return { id: doc.id, ...data }
}

async function count(query) {
  const snap = await query.count().get()
  const data = snap.data()
  return data && data.count != null ? data.count : 0
}

async function recentTickets(baseQuery, limit = 5) {
  const snap = await baseQuery.orderBy('createdAt', 'desc').limit(limit).get()
  return snap.docs.map(serializeTicket)
}

async function customerDashboard(uid) {
  const base = ticketsRef().where('customerId', '==', uid)

  const [totalCount, resolvedCount, recent] = await Promise.all([
    count(base),
    count(base.where('status', '==', TICKET_STATUSES.RESOLVED)),
    recentTickets(base),
  ])

  return {
    totalCount,
    openCount: totalCount - resolvedCount,
    resolvedCount,
    recentTickets: recent,
    computedAt: new Date().toISOString(),
  }
}

async function agentDashboard(uid) {
  const assigned = ticketsRef().where('assignedAgentId', '==', uid)

  const [assignedTotal, resolvedCount, poolCount, recent] = await Promise.all([
    count(assigned),
    count(assigned.where('status', '==', TICKET_STATUSES.RESOLVED)),
    count(ticketsRef().where('status', '==', TICKET_STATUSES.NEW)),
    recentTickets(assigned),
  ])

  return {
    assignedCount: assignedTotal,
    openCount: assignedTotal - resolvedCount,
    resolvedCount,
    poolCount,
    recentTickets: recent,
    computedAt: new Date().toISOString(),
  }
}

module.exports = { customerDashboard, agentDashboard }