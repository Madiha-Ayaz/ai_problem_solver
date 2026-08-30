import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TicketTable from '../../components/tickets/TicketTable'
import LoadingState from '../../components/ui/LoadingState'
import ErrorState from '../../components/ui/ErrorState'
import { SelectField } from '../../components/forms/FormField'
import { TICKET_STATUSES } from '../../config/tickets'
import { api } from '../../lib/api'


export default function AdminTickets() {
  const navigate = useNavigate()
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [status, setStatus] = useState('')

  const statusOptions = [TICKET_STATUSES.NEW, TICKET_STATUSES.ASSIGNED, TICKET_STATUSES.IN_PROGRESS, TICKET_STATUSES.RESOLVED]

  const load = async (filter = status) => {
    setLoading(true)
    setError(null)
    try {
      const data = await api.admin.allTickets(filter || undefined)
      setTickets(data.tickets || [])
    } catch (e) {
      setError(e.message || 'Could not load tickets.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <>
      <div className="page-head page-head-row">
        <div>
          <h1>All tickets</h1>
          <p className="muted">Every ticket on the platform, regardless of customer or agent.</p>
        </div>
        <SelectField
          name="statusFilter"
          placeholder="All statuses"
          options={statusOptions}
          value={status}
          onChange={(e) => {
            setStatus(e.target.value)
            load(e.target.value || '')
          }}
          aria-label="Filter by status"
        />
      </div>

      {loading && <LoadingState label="Loading tickets…" />}
      {!loading && error && <ErrorState message={error} onRetry={() => load()} />}
      {!loading && !error && (
        <TicketTable
          tickets={tickets}
          onSelect={(id) => navigate(`/admin/tickets/${id}`)}
        />
      )}
    </>
  )
}