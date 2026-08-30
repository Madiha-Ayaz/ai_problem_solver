







export const TICKET_STATUSES = {
  NEW: 'NEW',
  ASSIGNED: 'ASSIGNED',
  IN_PROGRESS: 'IN_PROGRESS',
  RESOLVED: 'RESOLVED',
}




export const TICKET_FLOW = {
  [TICKET_STATUSES.NEW]: [TICKET_STATUSES.ASSIGNED, TICKET_STATUSES.IN_PROGRESS, TICKET_STATUSES.RESOLVED],
  [TICKET_STATUSES.ASSIGNED]: [TICKET_STATUSES.IN_PROGRESS, TICKET_STATUSES.RESOLVED],
  [TICKET_STATUSES.IN_PROGRESS]: [TICKET_STATUSES.RESOLVED],
  [TICKET_STATUSES.RESOLVED]: [TICKET_STATUSES.IN_PROGRESS, TICKET_STATUSES.NEW], 
}


export const STATUS_META = {
  [TICKET_STATUSES.NEW]: { label: 'New', tone: 'info' },
  [TICKET_STATUSES.ASSIGNED]: { label: 'Assigned', tone: 'warning' },
  [TICKET_STATUSES.IN_PROGRESS]: { label: 'In Progress', tone: 'active' },
  [TICKET_STATUSES.RESOLVED]: { label: 'Resolved', tone: 'success' },
}


export const PRIORITIES = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
}

export const PRIORITY_META = {
  [PRIORITIES.LOW]: { label: 'Low', tone: 'neutral' },
  [PRIORITIES.MEDIUM]: { label: 'Medium', tone: 'warning' },
  [PRIORITIES.HIGH]: { label: 'High', tone: 'danger' },
}


export const CATEGORIES = [
  'Account',
  'Billing',
  'Technical',
  'Feature Request',
  'Bug',
  'Other',
]


export const TICKET_NUMBER_PREFIX = 'SFL'


export const ROLES = {
  CUSTOMER: 'customer',
  AGENT: 'agent',
  ADMIN: 'admin',
}