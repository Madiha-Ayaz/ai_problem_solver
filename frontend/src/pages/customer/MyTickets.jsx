import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import TicketTable from '../../components/tickets/TicketTable'
import LoadingState from '../../components/ui/LoadingState'
import ErrorState from '../../components/ui/ErrorState'
import { useAuth } from '../../context/AuthContext'
import { useCustomerTickets } from '../../hooks/useRealtime'
import { api } from '../../lib/api'




export default function MyTickets() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const sub = useCustomerTickets(user?.uid)

  const [apiTickets, setApiTickets] = useState(null)
  const [apiLoading, setApiLoading] = useState(true)
  const [apiError, setApiError] = useState(null)

  const loadApi = () => {
    if (!user?.uid) return
    setApiLoading(true)
    setApiError(null)
    api
      .listMyTickets()
      .then((res) => setApiTickets(res.tickets || []))
      .catch((e) => setApiError(e.message || 'Could not load your tickets.'))
      .finally(() => setApiLoading(false))
  }

  useEffect(() => {
    loadApi()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid])

  
  const tickets = sub.data ?? apiTickets ?? []

  
  
  const loading = apiLoading
  const error = apiError

  return (
    <>
      <div className="page-head page-head-row">
        <div>
          <h1>My Tickets</h1>
          <p className="muted">Only tickets created by you appear here, with live status updates.</p>
        </div>
        <Link to="/customer/tickets/new" className="btn btn-primary">
          Create ticket
        </Link>
      </div>

      {loading && <LoadingState label="Loading your tickets…" />}
      {!loading && error && <ErrorState message={error} onRetry={loadApi} />}
      {!loading && !error && (
        <TicketTable
          tickets={tickets}
          onSelect={(id) => navigate(`/customer/tickets/${id}`)}
          emptyAction={
            <Link to="/customer/tickets/new" className="btn btn-primary btn-sm">
              Create your first ticket
            </Link>
          }
        />
      )}
    </>
  )
}