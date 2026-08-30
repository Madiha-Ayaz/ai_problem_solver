













import { collection, doc, onSnapshot, orderBy, query, where, limit } from 'firebase/firestore'
import { db } from './firebase'

function serializeDoc(ref) {
  const data = ref.exists ? ref.data() : {}
  const result = { ...data }
  if (ref.exists) result.id = ref.id
  for (const key of Object.keys(result)) {
    const value = result[key]
    if (value && typeof value.toDate === 'function') {
      result[key] = value.toDate().toISOString()
    }
  }
  return result
}

function observe(refOrQuery, onNext, onError) {
  return onSnapshot(refOrQuery, {
    next: (snap) => onNext(snap.docs ? snap.docs.map(serializeDoc) : serializeDoc(snap)),
    error: onError,
  })
}


export function subscribeTicket(ticketId, { next, error }) {
  return observe(doc(db, 'tickets', ticketId), next, error)
}


export function subscribeTicketMessages(ticketId, { next, error }) {
  const q = query(
    collection(db, 'tickets', ticketId, 'messages'),
    orderBy('createdAt', 'asc'),
    limit(200)
  )
  return observe(q, next, error)
}


export function subscribeCustomerTickets(customerId, { next, error }) {
  const q = query(
    collection(db, 'tickets'),
    where('customerId', '==', customerId),
    orderBy('createdAt', 'desc'),
    limit(100)
  )
  return observe(q, next, error)
}



export function subscribeAgentAssigned(agentUid, { next, error }) {
  const q = query(
    collection(db, 'tickets'),
    where('assignedAgentId', '==', agentUid),
    orderBy('createdAt', 'desc'),
    limit(200)
  )
  return observe(q, next, error)
}



export function subscribePool({ next, error }) {
  const q = query(
    collection(db, 'tickets'),
    where('status', '==', 'NEW'),
    orderBy('createdAt', 'desc'),
    limit(500)
  )
  return observe(q, next, error)
}


export function subscribeTicketEvents({ next, error }) {
  const q = query(collection(db, 'events'), orderBy('createdAt', 'desc'), limit(100))
  return observe(q, next, error)
}