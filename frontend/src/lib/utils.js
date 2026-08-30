



import { TICKET_NUMBER_PREFIX, PRIORITY_META, STATUS_META } from '../config/tickets'


export function formatDate(value) {
  if (!value) return '—'
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}


export function cx(...parts) {
  return parts.filter(Boolean).join(' ')
}


export function ticketNumber(id, padding = 6) {
  const seq = String(id ?? '').padStart(padding, '0')
  return `${TICKET_NUMBER_PREFIX}-${seq}`
}

export function statusMeta(status) {
  return STATUS_META[status] || { label: status || '—', tone: 'neutral' }
}

export function priorityMeta(priority) {
  return PRIORITY_META[priority] || { label: priority || '—', tone: 'neutral' }
}


export function initials(name) {
  if (!name) return '?'
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('')
}