






const { admin, db } = require('../config/firebase')
const { AppError } = require('../middleware/errors')
const { ADMIN_BOOTSTRAP_KEY } = require('../config/env')
const { ROLES, TICKET_STATUSES, STATUSES } = require('../constants/ticket')
const { getUser, updateUser, listUsers } = require('../models/user.model')
const messageModel = require('../models/message.model')
const neonMirror = require('../models/neon/mirror')

const usersRef = () => db.collection('users')
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



async function existingAdmins() {
  const profiles = await listUsers({ role: ROLES.ADMIN, limit: 50 })
  const existing = []
  for (const p of profiles) {
    try {
      await admin.auth().getUser(p.uid)
      existing.push(p)
    } catch {
      
    }
  }
  return existing
}

async function count(query) {
  const snap = await query.count().get()
  const data = snap.data()
  return data && data.count != null ? data.count : 0
}


function sanitizeUser(u) {
  if (!u) return null
  const createdAt =
    u.createdAt && typeof u.createdAt.toDate === 'function'
      ? u.createdAt.toDate().toISOString()
      : u.createdAt || null
  return {
    uid: u.uid,
    name: u.name || '',
    email: u.email || '',
    role: u.role || ROLES.CUSTOMER,
    isActive: u.isActive !== false,
    provider: u.provider || null,
    createdAt,
  }
}

async function stats() {
  try {
    const rows = await authUserRows()
    const [totalTickets, newTickets, assignedTickets, inProgressTickets, resolvedTickets] =
      await Promise.all([
        count(ticketsRef()),
        count(ticketsRef().where('status', '==', TICKET_STATUSES.NEW)),
        count(ticketsRef().where('status', '==', TICKET_STATUSES.ASSIGNED)),
        count(ticketsRef().where('status', '==', TICKET_STATUSES.IN_PROGRESS)),
        count(ticketsRef().where('status', '==', TICKET_STATUSES.RESOLVED)),
      ])

    return {
      totalUsers: rows.length,
      customers: rows.filter((r) => r.role === ROLES.CUSTOMER).length,
      agents: rows.filter((r) => r.role === ROLES.AGENT).length,
      admins: rows.filter((r) => r.role === ROLES.ADMIN).length,
      activeUsers: rows.length,
      totalTickets,
      newTickets,
      assignedTickets,
      inProgressTickets,
      resolvedTickets,
      computedAt: new Date().toISOString(),
    }
  } catch (e) {
    
    console.error('[admin.stats] Firestore unavailable, using Neon:', e.message)
    return (await neonMirror.stats()) || {}
  }
}





async function authUserRows() {
  const [profilesSnap, authResult] = await Promise.all([
    db.collection('users').limit(500).get(),
    admin.auth().listUsers(1000),
  ])
  const profileById = new Map(profilesSnap.docs.map((d) => [d.id, d.data()]))
  const rows = authResult.users.map((u) => {
    const p = profileById.get(u.uid) || {}
    let role = p.role
    if (!role && u.customClaims && u.customClaims.role) role = u.customClaims.role
    const createdAt =
      p.createdAt ||
      (u.metadata && u.metadata.creationTime ? new Date(u.metadata.creationTime).toISOString() : null)
    const provider =
      p.provider || (u.providerData && u.providerData[0] && u.providerData[0].providerId) || null
    return sanitizeUser({
      uid: u.uid,
      name: p.name || u.displayName || '',
      email: p.email || u.email || '',
      role: role || ROLES.CUSTOMER,
      isActive: p.isActive !== false,
      provider,
      createdAt,
    })
  })
  rows.sort((a, b) => ((a.createdAt || '') < (b.createdAt || '') ? 1 : -1))
  return rows
}

async function users({ role, limit = 200 } = {}) {
  try {
    const rows = await authUserRows()
    const filtered = role ? rows.filter((r) => r.role === role) : rows
    return filtered.slice(0, Math.min(limit, 500))
  } catch (e) {
    console.error('[admin.users] Firestore unavailable, using Neon:', e.message)
    return (await neonMirror.listUsers({ role, limit })) || []
  }
}

async function allTickets({ status, limit = 50 } = {}) {
  try {
    let query = ticketsRef()
    if (status && STATUSES.includes(status)) {
      query = query.where('status', '==', status)
    }
    const snap = await query.orderBy('createdAt', 'desc').limit(Math.min(limit, 200)).get()
    return snap.docs.map(serializeTicket)
  } catch (e) {
    console.error('[admin.allTickets] Firestore unavailable, using Neon:', e.message)
    return (await neonMirror.allTickets({ status, limit })) || []
  }
}


async function getUserInfo(uid) {
  try {
    let user = await getUser(uid)
    if (!user) {
      try {
        await admin.auth().getUser(uid)
        user = { uid, name: '', email: '', role: ROLES.CUSTOMER }
      } catch {
        throw new AppError(404, 'User not found', 'USER_NOT_FOUND')
      }
    }
    return sanitizeUser(user)
  } catch (e) {
    if (e instanceof AppError) throw e
    console.error('[admin.getUserInfo] Firestore unavailable, using Neon:', e.message)
    const n = await neonMirror.getUserByUid(uid)
    if (!n) throw new AppError(404, 'User not found', 'USER_NOT_FOUND')
    return n
  }
}


async function getTicket(ticketId) {
  try {
    const snap = await ticketsRef().doc(ticketId).get()
    if (!snap.exists) {
      throw new AppError(404, 'Ticket not found', 'TICKET_NOT_FOUND')
    }
    return serializeTicket(snap)
  } catch (e) {
    if (e instanceof AppError && !/Project Id|project id/i.test(e.message)) throw e
    if (!(e instanceof AppError)) console.error('[admin.getTicket] Firestore unavailable, using Neon:', e.message)
    const n = await neonMirror.getTicket(ticketId)
    if (!n) throw new AppError(404, 'Ticket not found', 'TICKET_NOT_FOUND')
    return n
  }
}



async function userTickets(uid, { limit = 100 } = {}) {
  try {
    const whereOwner = ticketsRef().where('customerId', '==', uid)
    const whereAssigned = ticketsRef().where('assignedAgentId', '==', uid)
    const [ownerSnap, assignedSnap] = await Promise.all([whereOwner.get(), whereAssigned.get()])
    const byId = new Map()
    for (const snap of [ownerSnap, assignedSnap]) {
      for (const doc of snap.docs) {
        if (!byId.has(doc.id)) byId.set(doc.id, serializeTicket(doc))
      }
    }
    const tickets = [...byId.values()]
    tickets.sort((a, b) => {
      const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0
      const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0
      return tb - ta
    })
    return tickets.slice(0, Math.min(limit, 200))
  } catch (e) {
    console.error('[admin.userTickets] Firestore unavailable, using Neon:', e.message)
    return (await neonMirror.userTickets(uid, { limit })) || []
  }
}






async function agentsOverview({ limit = 50 } = {}) {
  const max = Math.min(limit, 200)
  const agents = (await users({ role: ROLES.AGENT })).filter((u) => u.isActive !== false)

  try {
    
    const whereAssigned = ticketsRef().where('assignedAgentId', 'in', agents.map((a) => a.uid))
    const snap = await whereAssigned.orderBy('createdAt', 'desc').limit(max * 4).get()
    const ticketsByAgent = new Map()
    for (const doc of snap.docs) {
      const t = serializeTicket(doc)
      if (!t.assignedAgentId) continue
      if (!ticketsByAgent.has(t.assignedAgentId)) ticketsByAgent.set(t.assignedAgentId, [])
      ticketsByAgent.get(t.assignedAgentId).push(t)
    }

    return await Promise.all(agents.map(async (agent) => {
      const tickets = (ticketsByAgent.get(agent.uid) || []).slice(0, max)
      const resolveTasks = tickets
        .filter((t) => t.status === TICKET_STATUSES.RESOLVED && t.resolutionNote)
        .map((t) => ({
          id: t.id,
          ticketNumber: t.ticketNumber,
          subject: t.subject,
          priority: t.priority,
          category: t.category,
          status: t.status,
          resolutionNote: t.resolutionNote,
          resolvedAt: t.resolvedAt || null,
        }))

      
      const discussions = []
      for (const t of tickets) {
        const messages = await messageModel.listMessages(t.id, { limit: 500 })
        discussions.push({
          id: t.id,
          ticketId: t.id,
          ticketNumber: t.ticketNumber,
          subject: t.subject,
          status: t.status,
          messageCount: messages.length,
          lastMessageAt: messages.length ? messages[messages.length - 1].createdAt : null,
        })
      }
      discussions.sort((a, b) => (b.lastMessageAt || '') < (a.lastMessageAt || '') ? -1 : 1)

      return {
        uid: agent.uid,
        name: agent.name,
        email: agent.email,
        role: agent.role,
        isActive: agent.isActive,
        stats: {
          totalTickets: tickets.length,
          resolvedTasks: resolveTasks.length,
          activeDiscussions: discussions.filter((d) => d.messageCount > 0).length,
          totalMessages: discussions.reduce((n, d) => n + d.messageCount, 0),
        },
        resolveTasks,
        discussions,
      }
    }))
  } catch (e) {
    console.error('[admin.agentsOverview] Firestore unavailable, using Neon:', e.message)
    
    
    const all = (await neonMirror.allTickets({ limit: 500 })) || []
    return agents.map((agent) => {
      const tickets = all.filter((t) => t.assignedAgentId === agent.uid).slice(0, max)
      const resolveTasks = tickets
        .filter((t) => t.status === TICKET_STATUSES.RESOLVED && t.resolutionNote)
        .map((t) => ({
          id: t.id,
          ticketNumber: t.ticketNumber,
          subject: t.subject,
          priority: t.priority,
          category: t.category,
          status: t.status,
          resolutionNote: t.resolutionNote,
          resolvedAt: t.resolvedAt || null,
        }))
      return {
        uid: agent.uid,
        name: agent.name,
        email: agent.email,
        role: agent.role,
        isActive: agent.isActive,
        stats: {
          totalTickets: tickets.length,
          resolvedTasks: resolveTasks.length,
          activeDiscussions: 0,
          totalMessages: 0,
        },
        resolveTasks,
        discussions: tickets.map((t) => ({
          id: t.id,
          ticketId: t.id,
          ticketNumber: t.ticketNumber,
          subject: t.subject,
          status: t.status,
          messageCount: 0,
          lastMessageAt: null,
        })),
      }
    })
  }
}




async function setUserRole(actorUid, targetUid, { role, isActive } = {}) {
  if (targetUid === actorUid) {
    throw new AppError(400, 'You cannot change your own role or status', 'SELF_ROLE_CHANGE')
  }

  let target = await getUser(targetUid)
  try {
    await admin.auth().getUser(targetUid)
  } catch {
    throw new AppError(404, 'User not found', 'USER_NOT_FOUND')
  }

  
  
  target = target || { uid: targetUid, role: ROLES.CUSTOMER, isActive: true }
  const email = target.email || null

  const nextRole = role || target.role || ROLES.CUSTOMER
  const nextActive = isActive != null ? !!isActive : target.isActive !== false

  if (![ROLES.CUSTOMER, ROLES.AGENT, ROLES.ADMIN].includes(nextRole)) {
    throw new AppError(400, 'Invalid role', 'VALIDATION_ERROR')
  }

  
  if (
    target.role === ROLES.ADMIN &&
    (nextRole !== ROLES.ADMIN || !nextActive)
  ) {
    const admins = await existingAdmins()
    if (admins.length <= 1) {
      throw new AppError(400, 'Cannot demote or disable the last admin', 'LAST_ADMIN')
    }
  }

  await admin.auth().setCustomUserClaims(targetUid, { role: nextRole })
  const updated = await updateUser(targetUid, { role: nextRole, isActive: nextActive })
  return sanitizeUser(updated)
}



async function bootstrap(actorUid, { key } = {}) {
  if (!ADMIN_BOOTSTRAP_KEY || !key || key !== ADMIN_BOOTSTRAP_KEY) {
    throw new AppError(403, 'Admin bootstrap is not enabled', 'BOOTSTRAP_FORBIDDEN')
  }
  const admins = await existingAdmins()
  if (admins.length > 0) {
    throw new AppError(409, 'An admin already exists', 'ADMIN_EXISTS')
  }
  await admin.auth().setCustomUserClaims(actorUid, { role: ROLES.ADMIN })
  await updateUser(actorUid, { role: ROLES.ADMIN, isActive: true })
  return sanitizeUser(await getUser(actorUid))
}

module.exports = {
  stats,
  users,
  agentsOverview,
  allTickets,
  getTicket,
  getUserInfo,
  userTickets,
  setUserRole,
  bootstrap,
}