import { useEffect, useState } from 'react'
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import TicketTable from '../../components/tickets/TicketTable'
import LoadingState from '../../components/ui/LoadingState'
import ErrorState from '../../components/ui/ErrorState'
import EmptyState from '../../components/ui/EmptyState'
import { api } from '../../lib/api'
import { ROLES } from '../../config/tickets'
import { formatDate, initials } from '../../lib/utils'




export default function AdminUserTickets() {
  const { uid } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [user, setUser] = useState(null)
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  
  const locationName = location.state && location.state.name
  const locationEmail = location.state && location.state.email
  const from = (location.state && location.state.from) || '/admin/customers'

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const [u, t] = await Promise.all([
        api.admin.getUser(uid),
        api.admin.userTickets(uid),
      ])
      setUser(u.user || null)
      setTickets(t.tickets || [])
    } catch (e) {
      setError(e.message || 'Could not load this user\'s data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid])

  const name = (user && user.name) || locationName
  const email = (user && user.email) || locationEmail

  const roleTone = (r) => {
    if (r === ROLES.ADMIN) return 'badge-active'
    if (r === ROLES.AGENT) return 'badge-warning'
    return 'badge-neutral'
  }

  return (
    <>
      <div className="page-head page-head-row">
        <div>
          <Link to={from} className="back-link">
            <ArrowLeft size={16} /> Back
          </Link>
          <h1>{name ? `${name}'s details` : 'User details'}</h1>
          {email && <p className="muted">{email}</p>}
          {!email && <p className="muted">Profile and every ticket for this user.</p>}
        </div>
      </div>

      {loading && <LoadingState label="Loading profile…" />}
      {!loading && error && <ErrorState message={error} onRetry={load} />}
      {!loading && !error && user && (
        <>
          <div className="glass panel user-card">
            <div className="user-card-top">
              <div className="avatar avatar-fallback avatar-lg">
                {initials(name || email || '?')}
              </div>
              <div className="user-card-head">
                <h2 className="h3 user-card-name">{name || '—'}</h2>
                <p className="muted">{email || '—'}</p>
              </div>
            </div>
            <div className="user-card-meta">
              <span className={`badge ${roleTone(user.role)}`}>{user.role}</span>
              <span className={`badge ${user.isActive === false ? 'badge-danger' : 'badge-success'}`}>
                {user.isActive === false ? 'Disabled' : 'Active'}
              </span>
              <span className="muted">Joined {formatDate(user.createdAt)}</span>
            </div>
          </div>

          {tickets.length === 0 ? (
            <EmptyState
              icon="Tickets"
              title="No tickets yet"
              message="This user has not raised or handled any tickets."
            />
          ) : (
            <TicketTable
              tickets={tickets}
              showSuggestion
              onSelect={(id) => navigate(`/admin/tickets/${id}`)}
            />
          )}
        </>
      )}
    </>
  )
}