




export const appName = 'SupportFlow'
export const appTagline = 'AI-assisted support ticketing, simplified.'


export const publicLinks = [
  { label: 'Features', href: '#features' },
  { label: 'How it works', href: '#how' },
  { label: 'Support', href: '/login' },
]


export const customerNav = [
  { label: 'Dashboard', to: '/customer', icon: 'Dashboard', end: true },
  { label: 'My Tickets', to: '/customer/tickets', icon: 'Tickets' },
  { label: 'Create Ticket', to: '/customer/tickets/new', icon: 'PlusCircle' },
  { label: 'Profile', to: '/customer/profile', icon: 'User' },
]


export const agentNav = [
  { label: 'Dashboard', to: '/agent', icon: 'Dashboard', end: true },
  { label: 'Tickets', to: '/agent/tickets', icon: 'Tickets' },
  { label: 'Profile', to: '/agent/profile', icon: 'User' },
]


export const adminNav = [
  { label: 'Dashboard', to: '/admin', icon: 'Dashboard', end: true },
  { label: 'Customers', to: '/admin/customers', icon: 'Users' },
  { label: 'Agents', to: '/admin/agents', icon: 'UserCheck' },
  { label: 'User Tickets', to: '/admin/customer/tickets', icon: 'Tickets' },
  { label: 'Resolve Suggestions', to: '/admin/resolve/suggestions', icon: 'Sparkles' },
  { label: 'All Tickets', to: '/admin/tickets', icon: 'Layers' },
  { label: 'Neon Database', to: '/admin/neon', icon: 'Database' },
]


export function roleHome(role) {
  if (role === 'agent') return '/agent'
  if (role === 'admin') return '/admin'
  return '/customer'
}

export const adminStats = [
  { key: 'totalUsers', label: 'Total users', icon: 'Users' },
  { key: 'customers', label: 'Customers', icon: 'User' },
  { key: 'agents', label: 'Agents', icon: 'UserCheck' },
  { key: 'totalTickets', label: 'Tickets', icon: 'Tickets' },
  { key: 'newTickets', label: 'New', icon: 'Inbox' },
  { key: 'resolvedTickets', label: 'Resolved', icon: 'CheckCircle' },
]


export const customerStats = [
  { key: 'totalCount', label: 'Total tickets', icon: 'Tickets' },
  { key: 'openCount', label: 'Open', icon: 'Inbox' },
  { key: 'resolvedCount', label: 'Resolved', icon: 'CheckCircle' },
]


export const agentStats = [
  { key: 'assignedCount', label: 'Assigned to me', icon: 'Inbox' },
  { key: 'poolCount', label: 'Unassigned pool', icon: 'Layers' },
  { key: 'resolvedCount', label: 'Resolved', icon: 'CheckCircle' },
]