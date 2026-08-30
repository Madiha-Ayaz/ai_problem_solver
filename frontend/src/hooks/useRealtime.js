




import { useEffect, useState } from 'react'
import {
  subscribeTicket,
  subscribeTicketMessages,
  subscribeCustomerTickets,
  subscribeTicketEvents,
} from '../lib/realtime'

function useSubscription(createSubscription, deps) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError(null)
    const unsubscribe = createSubscription({
      next: (value) => {
        if (!active) return
        setData(value)
        setLoading(false)
      },
      error: (err) => {
        if (!active) return
        setError(err)
        setLoading(false)
      },
    })
    return () => {
      active = false
      if (typeof unsubscribe === 'function') unsubscribe()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return { data, loading, error }
}

export function useTicket(ticketId) {
  return useSubscription((handlers) => subscribeTicket(ticketId, handlers), [ticketId])
}

export function useTicketMessages(ticketId) {
  return useSubscription(
    (handlers) => subscribeTicketMessages(ticketId, handlers),
    [ticketId]
  )
}

export function useCustomerTickets(customerId) {
  return useSubscription(
    (handlers) => subscribeCustomerTickets(customerId, handlers),
    [customerId]
  )
}

export function useTicketEvents() {
  return useSubscription((handlers) => subscribeTicketEvents(handlers), [])
}