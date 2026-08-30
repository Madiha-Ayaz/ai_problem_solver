import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TicketTable from '../../components/tickets/TicketTable'
import LoadingState from '../../components/ui/LoadingState'
import ErrorState from '../../components/ui/ErrorState'
import { SelectField } from '../../components/forms/FormField'
import { TICKET_STATUSES } from '../../config/tickets'
import { api } from '../../lib/api'
import { cx } from '../../lib/utils'


export default function AgentTickets() {
  const navigate = useNavigate()
  const [scope, setScope] = useState('') 
  const [status, setStatus] = useState('')
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const statusOptions = [TICKET_STATUSES.NEW, TICKET_STATUSES.ASSIGNED, TICKET_STATUSES.IN_PROGRESS, TICKET_STATUSES.RESOLVED]

  const load = async (nextScope = scope, nextStatus = status) => {
    setLoading(true)
    setError(null)
    try {
      const data = await api.agent.tickets(nextScope || undefined, nextStatus || undefined)
      setTickets(data.tickets || [])
    } catch (e) {
      setError(e.message || 'Could not load the queue.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const changeScope = (next) => {
    setScope(next)
    load(next, '')
    setStatus('')
  }

  const changeStatus = (e) => {
    setStatus(e.target.value)
    load(scope, e.target.value)
  }

  return (
    <>
      <div className="page-head page-head-row">
        <div>
          <h1>Ticket queue</h1>
          <p className="muted">Tickets assigned to you, plus the unassigned pool with AI suggestions.</p>
        </div>
        <SelectField
          name="statusFilter"
          placeholder="All statuses"
          options={statusOptions}
          value={status}
          onChange={changeStatus}
          aria-label="Filter by status"
        />
      </div>

      <div className="tabs">
        <button type="button" className={cx('tab', scope === '' && 'tab-active')} onClick={() => changeScope('')}>
          Assigned to me
        </button>
        <button type="button" className={cx('tab', scope === 'pool' && 'tab-active')} onClick={() => changeScope('pool')}>
          Unassigned pool
        </button>
      </div>

      {loading && <LoadingState label="Loading the queue…" />}
      {!loading && error && <ErrorState message={error} onRetry={() => load()} />}
      {!loading && !error && (
        <TicketTable
          tickets={tickets}
          onSelect={(id) => navigate(`/agent/tickets/${id}`)}
          emptyAction={
            scope === 'pool' ? (
              <p className="muted">The pool is empty — new tickets appear here for claiming.</p>
            ) : undefined
          }
        />
      )}
    </>
  )
}