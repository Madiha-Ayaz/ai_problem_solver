






import { auth } from './firebase'

const BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '')

export class ApiError extends Error {
  constructor(status, message, code) {
    super(message)
    this.status = status
    this.code = code
  }
}

async function getToken() {
  try {
    const user = auth.currentUser
    if (!user) return null
    try {
      return await user.getIdToken()
    } catch {
      
      
      return await user.getIdToken(true)
    }
  } catch {
    return null
  }
}

async function request(
  path,
  { method = 'GET', body, retried = false, auth: needsAuth = true } = {}
) {
  const headers = { 'Content-Type': 'application/json' }
  if (needsAuth) {
    const token = await getToken()
    if (token) headers.Authorization = `Bearer ${token}`
  }

  let res
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    })
  } catch (e) {
    throw new ApiError(0, 'Network error — check your connection', 'NETWORK_ERROR')
  }

  let data = null
  try {
    data = await res.json()
  } catch {
    
  }

  
  
  if (!res.ok && needsAuth && res.status === 401 && !retried) {
    const user = auth.currentUser
    if (user) {
      try {
        await user.getIdToken(true)
        return request(path, { method, body, needsAuth, retried: true })
      } catch {
        
      }
    }
  }

  if (!res.ok) {
    if (res.status === 401) {
      throw new ApiError(401, 'Session expired, please sign in again', 'INVALID_TOKEN')
    }
    throw new ApiError(res.status, (data && data.error) || 'Request failed', data && data.code)
  }
  return data
}

export const api = {
  createTicket: (payload) => request('/api/tickets', { method: 'POST', body: payload }),
  syncRole: (role) => request('/api/auth/sync', { method: 'POST', body: role ? { role } : undefined }),
  me: () => request('/api/auth/me'),
  listMyTickets: () => request('/api/tickets'),
  getTicket: (id) => request(`/api/tickets/${id}`),
  messages: {
    list: (ticketId) => request(`/api/tickets/${ticketId}/messages`),
    send: (ticketId, message) =>
      request(`/api/tickets/${ticketId}/messages`, { method: 'POST', body: { message } }),
  },
  dashboard: {
    customer: () => request('/api/dashboard/customer'),
    agent: () => request('/api/dashboard/agent'),
  },
  agent: {
    tickets: (scope, status) => {
      const params = new URLSearchParams()
      if (scope) params.set('scope', scope)
      if (status) params.set('status', status)
      const qs = params.toString()
      return request(`/api/agent/tickets${qs ? `?${qs}` : ''}`)
    },
    get: (id) => request(`/api/agent/tickets/${id}`),
    update: (id, patch) => request(`/api/agent/tickets/${id}`, { method: 'PATCH', body: patch }),
    resolve: (id, resolutionNote) =>
      request(`/api/agent/tickets/${id}/resolve`, { method: 'POST', body: { resolutionNote } }),
    reopen: (id) =>
      request(`/api/agent/tickets/${id}/reopen`, { method: 'POST' }),
  },
  admin: {
    stats: () => request('/api/admin/stats'),
    users: (role) => request(`/api/admin/users${role ? `?role=${role}` : ''}`),
    allTickets: (status, limit) => {
      const params = new URLSearchParams()
      if (status) params.set('status', status)
      if (limit) params.set('limit', String(limit))
      const qs = params.toString()
      return request(`/api/admin/tickets${qs ? `?${qs}` : ''}`)
    },
    getTicket: (id) => request(`/api/admin/tickets/${id}`),
    similarTickets: (id) => request(`/api/admin/tickets/${id}/similar`),
    getUser: (uid) => request(`/api/admin/users/${uid}`),
    userTickets: (uid) => request(`/api/admin/users/${uid}/tickets`),
    setUserRole: (uid, patch) => request(`/api/admin/users/${uid}`, { method: 'PATCH', body: patch }),
    bootstrap: (key) => request('/api/admin/bootstrap', { method: 'POST', body: { key } }),
    agentsOverview: () => request('/api/admin/agents/overview'),
    neon: () => request('/api/admin/neon'),
    neonSync: () => request('/api/admin/neon/sync', { method: 'POST' }),
  },
}
