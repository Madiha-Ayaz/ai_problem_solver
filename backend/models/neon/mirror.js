








const { query } = require('../../config/db')

let initialized = false

const DDL = [
  `CREATE TABLE IF NOT EXISTS users (
    uid         TEXT PRIMARY KEY,
    name        TEXT,
    email       TEXT,
    role        TEXT,
    provider    TEXT DEFAULT 'email',
    is_active   BOOLEAN DEFAULT TRUE,
    created_at  TIMESTAMPTZ DEFAULT now(),
    updated_at  TIMESTAMPTZ DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS tickets (
    id                 TEXT PRIMARY KEY,
    ticket_number      TEXT UNIQUE,
    subject            TEXT NOT NULL,
    description        TEXT,
    category           TEXT,
    priority           TEXT,
    summary            TEXT DEFAULT '',
    recommendation     TEXT DEFAULT '',
    status             TEXT NOT NULL,
    customer_id        TEXT NOT NULL,
    assigned_agent_id  TEXT,
    ai_suggestion      JSONB,
    ai_reviewed        BOOLEAN DEFAULT FALSE,
    resolution_note    TEXT,
    created_at         TIMESTAMPTZ DEFAULT now(),
    updated_at         TIMESTAMPTZ DEFAULT now(),
    resolved_at        TIMESTAMPTZ
  )`,
  
  `ALTER TABLE tickets ADD COLUMN IF NOT EXISTS recommendation TEXT DEFAULT ''`,
  `CREATE TABLE IF NOT EXISTS messages (
    id          TEXT PRIMARY KEY,
    ticket_id   TEXT NOT NULL,
    sender_id   TEXT,
    sender_role TEXT,
    author_name TEXT,
    message     TEXT,
    created_at  TIMESTAMPTZ DEFAULT now(),
    updated_at  TIMESTAMPTZ DEFAULT now()
  )`,
]

async function ensureSchema() {
  if (initialized) return
  for (const sql of DDL) await query(sql)
  initialized = true
}

function toIso(value) {
  if (!value) return null
  if (typeof value.toDate === 'function') return value.toDate().toISOString()
  if (value instanceof Date) return value.toISOString()
  return value
}

function userRow(u) {
  return {
    uid: u.uid != null ? u.uid : u.id,
    name: u.name || null,
    email: u.email || null,
    role: u.role || null,
    provider: u.provider || 'email',
    isActive: u.isActive != null ? !!u.isActive : true,
  }
}

function ticketRow(t) {
  return {
    id: t.id,
    ticketNumber: t.ticketNumber || null,
    subject: t.subject || '',
    description: t.description || null,
    category: t.category || null,
    priority: t.priority || null,
    summary: t.summary || '',
    recommendation: t.recommendation || '',
    status: t.status || 'NEW',
    customerId: t.customerId || '',
    assignedAgentId: t.assignedAgentId || null,
    aiSuggestion: t.aiSuggestion ? JSON.stringify(t.aiSuggestion) : null,
    aiReviewed: !!t.aiReviewed,
    resolutionNote: t.resolutionNote || null,
    createdAt: toIso(t.createdAt),
    updatedAt: toIso(t.updatedAt),
    resolvedAt: toIso(t.resolvedAt),
  }
}

function messageRow(m) {
  return {
    id: m.id,
    ticketId: m.ticketId,
    senderId: m.senderId || null,
    senderRole: m.senderRole || null,
    authorName: m.authorName || null,
    message: m.message || '',
    createdAt: toIso(m.createdAt),
    updatedAt: toIso(m.updatedAt),
  }
}

async function upsertUser(u) {
  if (!u || u.uid == null) return false
  await ensureSchema()
  const r = userRow(u)
  await query(
    `INSERT INTO users (uid, name, email, role, provider, is_active)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (uid) DO UPDATE SET
       name = EXCLUDED.name, email = EXCLUDED.email, role = EXCLUDED.role,
       provider = EXCLUDED.provider, is_active = EXCLUDED.is_active,
       updated_at = now()`,
    [r.uid, r.name, r.email, r.role, r.provider, r.isActive]
  )
  return true
}

async function upsertTicket(t) {
  if (!t || !t.id) return false
  await ensureSchema()
  const r = ticketRow(t)
  await query(
    `INSERT INTO tickets
       (id, ticket_number, subject, description, category, priority, summary,
        recommendation, status, customer_id, assigned_agent_id, ai_suggestion,
        ai_reviewed, resolution_note, created_at, updated_at, resolved_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
     ON CONFLICT (id) DO UPDATE SET
       ticket_number = EXCLUDED.ticket_number, subject = EXCLUDED.subject,
       description = EXCLUDED.description, category = EXCLUDED.category,
       priority = EXCLUDED.priority, summary = EXCLUDED.summary,
       recommendation = EXCLUDED.recommendation, status = EXCLUDED.status,
       customer_id = EXCLUDED.customer_id, assigned_agent_id = EXCLUDED.assigned_agent_id,
       ai_suggestion = EXCLUDED.ai_suggestion, ai_reviewed = EXCLUDED.ai_reviewed,
       resolution_note = EXCLUDED.resolution_note,
       created_at = EXCLUDED.created_at,
       updated_at = now(),
       resolved_at = EXCLUDED.resolved_at`,
    [
      r.id, r.ticketNumber, r.subject, r.description, r.category, r.priority,
      r.summary, r.recommendation, r.status, r.customerId, r.assignedAgentId,
      r.aiSuggestion, r.aiReviewed, r.resolutionNote, r.createdAt, r.updatedAt,
      r.resolvedAt,
    ]
  )
  return true
}

async function upsertMessage(m) {
  if (!m || !m.id) return false
  await ensureSchema()
  const r = messageRow(m)
  await query(
    `INSERT INTO messages
       (id, ticket_id, sender_id, sender_role, author_name, message)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (id) DO UPDATE SET
       message = EXCLUDED.message, updated_at = now()`,
    [r.id, r.ticketId, r.senderId, r.senderRole, r.authorName, r.message]
  )
  return true
}

function rowToUser(row) {
  if (!row) return null
  return {
    uid: row.uid,
    name: row.name,
    email: row.email,
    role: row.role,
    provider: row.provider,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function rowToTicket(row) {
  if (!row) return null
  return {
    id: row.id,
    ticketNumber: row.ticket_number,
    subject: row.subject,
    description: row.description,
    category: row.category,
    priority: row.priority,
    summary: row.summary,
    recommendation: row.recommendation,
    status: row.status,
    customerId: row.customer_id,
    assignedAgentId: row.assigned_agent_id,
    aiSuggestion: row.ai_suggestion,
    aiReviewed: row.ai_reviewed,
    resolutionNote: row.resolution_note,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    resolvedAt: row.resolved_at,
  }
}

function rowToMessage(row) {
  if (!row) return null
  return {
    id: row.id,
    ticketId: row.ticket_id,
    senderId: row.sender_id,
    senderRole: row.sender_role,
    authorName: row.author_name,
    message: row.message,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}


async function getOverview({ rows = 15 } = {}) {
  await ensureSchema()
  const [ping, users, tickets, messages, uRows, tRows, mRows] = await Promise.all([
    query('SELECT 1 AS ok'),
    query('SELECT count(*)::int AS n FROM users'),
    query('SELECT count(*)::int AS n FROM tickets'),
    query('SELECT count(*)::int AS n FROM messages'),
    query('SELECT * FROM users ORDER BY created_at DESC LIMIT $1', [rows]),
    query('SELECT * FROM tickets ORDER BY created_at DESC LIMIT $1', [rows]),
    query('SELECT * FROM messages ORDER BY created_at DESC LIMIT $1', [rows]),
  ])
  const num = (result) => (result.rows && result.rows[0] ? result.rows[0].n : 0)
  return {
    connected: !!(ping.rows && ping.rows.length),
    counts: {
      users: num(users),
      tickets: num(tickets),
      messages: num(messages),
    },
    users: uRows.rows.map(rowToUser).filter(Boolean),
    tickets: tRows.rows.map(rowToTicket).filter(Boolean),
    messages: mRows.rows.map(rowToMessage).filter(Boolean),
  }
}




async function stats() {
  const count = async (sql, params) => {
    const r = await query(sql, params)
    return r.rows && r.rows[0] ? r.rows[0].n : 0
  }
  const [
    totalUsers, customers, agents, admins,
    totalTickets, newT, assignedT, inProgT, resolvedT,
  ] = await Promise.all([
    count('SELECT count(*)::int AS n FROM users'),
    count('SELECT count(*)::int AS n FROM users WHERE role = $1', ['customer']),
    count('SELECT count(*)::int AS n FROM users WHERE role = $1', ['agent']),
    count('SELECT count(*)::int AS n FROM users WHERE role = $1', ['admin']),
    count('SELECT count(*)::int AS n FROM tickets'),
    count('SELECT count(*)::int AS n FROM tickets WHERE status = $1', ['NEW']),
    count('SELECT count(*)::int AS n FROM tickets WHERE status = $1', ['ASSIGNED']),
    count('SELECT count(*)::int AS n FROM tickets WHERE status = $1', ['IN_PROGRESS']),
    count('SELECT count(*)::int AS n FROM tickets WHERE status = $1', ['RESOLVED']),
  ])
  return {
    totalUsers,
    customers,
    agents,
    admins,
    activeUsers: totalUsers,
    totalTickets,
    newTickets: newT,
    assignedTickets: assignedT,
    inProgressTickets: inProgT,
    resolvedTickets: resolvedT,
    computedAt: new Date().toISOString(),
  }
}

async function listUsers({ role, limit = 200 } = {}) {
  const limitNum = Math.min(limit, 500)
  let rows
  if (role) {
    rows = await query('SELECT * FROM users WHERE role = $1 ORDER BY created_at DESC LIMIT $2', [role, limitNum])
  } else {
    rows = await query('SELECT * FROM users ORDER BY created_at DESC LIMIT $1', [limitNum])
  }
  return (rows.rows || []).map(rowToUser)
}

async function allTickets({ status, limit = 50 } = {}) {
  const limitNum = Math.min(limit || 50, 200)
  let rows
  if (status) {
    rows = await query('SELECT * FROM tickets WHERE status = $1 ORDER BY created_at DESC LIMIT $2', [status, limitNum])
  } else {
    rows = await query('SELECT * FROM tickets ORDER BY created_at DESC LIMIT $1', [limitNum])
  }
  return (rows.rows || []).map(rowToTicket)
}

async function getTicket(ticketId) {
  const rows = await query('SELECT * FROM tickets WHERE id = $1', [ticketId])
  return rows.rows && rows.rows[0] ? rowToTicket(rows.rows[0]) : null
}




async function listAgentTickets(agentUid, { scope, status, limit = 50 } = {}) {
  const limitNum = Math.min(limit || 50, 200)
  const params = []
  let where = ''
  if (scope === 'pool') {
    where = 'WHERE status = $1'
    params.push('NEW')
  } else {
    where = 'WHERE assigned_agent_id = $1'
    params.push(agentUid)
    if (status) {
      where += ' AND status = $' + (params.length + 1)
      params.push(status)
    }
  }
  params.push(limitNum)
  const rows = await query(
    `SELECT * FROM tickets ${where} ORDER BY created_at DESC LIMIT $${params.length}`,
    params
  )
  return (rows.rows || []).map(rowToTicket)
}

async function userTickets(uid, { limit = 100 } = {}) {
  const limitNum = Math.min(limit || 100, 200)
  const rows = await query(
    `SELECT * FROM tickets
     WHERE customer_id = $1 OR assigned_agent_id = $1
     ORDER BY created_at DESC LIMIT $2`,
    [uid, limitNum]
  )
  return (rows.rows || []).map(rowToTicket)
}

async function getUserByUid(uid) {
  const rows = await query('SELECT * FROM users WHERE uid = $1', [uid])
  return rows.rows && rows.rows[0] ? rowToUser(rows.rows[0]) : null
}


async function syncAll() {
  await ensureSchema()
  const { db } = require('../../config/firebase')
  let users = 0
  let tickets = 0
  let messages = 0

  const userSnap = await db.collection('users').limit(1000).get()
  for (const d of userSnap.docs) {
    if (await upsertUser({ uid: d.id, ...d.data() })) users++
  }

  const ticketSnap = await db.collection('tickets').limit(1000).get()
  for (const d of ticketSnap.docs) {
    const t = d.data()
    if (await upsertTicket({ id: d.id, ...t })) tickets++
    const msgSnap = await d.ref.collection('messages').limit(500).get()
    for (const md of msgSnap.docs) {
      if (await upsertMessage({ id: md.id, ...md.data() })) messages++
    }
  }

  return { users, tickets, messages }
}

async function safe(fn) {
  try {
    const value = await fn()
    return value
  } catch (e) {
    console.error('[Neon] operation failed:', e.message)
    return null
  }
}

module.exports = {
  ensureSchema,
  upsertUser: (u) => safe(() => upsertUser(u)),
  upsertTicket: (t) => safe(() => upsertTicket(t)),
  upsertMessage: (m) => safe(() => upsertMessage(m)),
  getOverview: () => safe(() => getOverview()),
  syncAll: () => safe(() => syncAll()),
  stats: () => safe(() => stats()),
  listUsers: (o) => safe(() => listUsers(o)),
  allTickets: (o) => safe(() => allTickets(o)),
  getTicket: (id) => safe(() => getTicket(id)),
  userTickets: (uid, o) => safe(() => userTickets(uid, o)),
  listAgentTickets: (uid, o) => safe(() => listAgentTickets(uid, o)),
  getUserByUid: (uid) => safe(() => getUserByUid(uid)),
}