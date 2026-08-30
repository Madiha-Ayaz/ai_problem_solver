import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import DashboardCard from '../../components/ui/DashboardCard'
import LoadingState from '../../components/ui/LoadingState'
import ErrorState from '../../components/ui/ErrorState'
import TicketTable from '../../components/tickets/TicketTable'
import { adminStats } from '../../config/app'
import { api } from '../../lib/api'
import { ROLES } from '../../config/tickets'
import { initials } from '../../lib/utils'

function roleTone(r) {
  if (r === ROLES.ADMIN) return 'badge-active'
  if (r === ROLES.AGENT) return 'badge-warning'
  return 'badge-neutral'
}

function UserRow({ u, onView }) {
  return (
    <button type="button" className="user-row" onClick={() => onView(u.uid)}>
      <div className="avatar avatar-fallback">
        {initials(u.name || u.email || '?')}
      </div>
      <div className="user-row-main">
        <span className="user-row-name">{u.name || '—'}</span>
        <span className="muted">{u.email}</span>
      </div>
      <span className={`badge ${roleTone(u.role)}`}>{u.role}</span>
      <span className={`badge ${u.isActive === false ? 'badge-danger' : 'badge-success'}`}>
        {u.isActive === false ? 'Disabled' : 'Active'}
      </span>
    </button>
  )
}



export default function AdminDashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [customers, setCustomers] = useState([])
  const [agents, setAgents] = useState([])
  const [recent, setRecent] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const [s, c, a, t] = await Promise.all([
        api.admin.stats(),
        api.admin.users(ROLES.CUSTOMER),
        api.admin.users(ROLES.AGENT),
        api.admin.allTickets(undefined, 8).catch(() => ({ tickets: [] })),
      ])
      setStats(s.stats)
      setCustomers(c.users || [])
      setAgents(a.users || [])
      setRecent(t.tickets || [])
    } catch (e) {
      setError(e.message || 'Could not load admin data.')
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
      <div className="page-head">
        <h1>Admin dashboard</h1>
        <p className="muted">
          Manage customers and agents, and get a full view of every ticket on the platform.
        </p>
      </div>

      {loading && <LoadingState label="Loading admin data…" />}
      {!loading && error && <ErrorState message={error} onRetry={load} />}
      {!loading && !error && (
        <>
          <div className="stat-grid">
            {adminStats.map((s) => (
              <DashboardCard key={s.key} label={s.label} value={stats?.[s.key]} icon={s.icon} />
            ))}
          </div>

          <div className="quick-actions">
            <Link to="/admin/customers" className="btn btn-primary">Manage customers</Link>
            <Link to="/admin/agents" className="btn btn-ghost">Manage agents</Link>
            <Link to="/admin/tickets" className="btn btn-ghost">All tickets</Link>
          </div>

          <div className="dash-grid">
            <section className="glass panel">
              <header className="panel-head">
                <h2 className="panel-title">Recent customers</h2>
                <span className="muted">{customers.length} total</span>
              </header>
              <div className="dash-user-list">
                {customers.length === 0 && <p className="muted">No customers yet.</p>}
                {customers.slice(0, 6).map((u) => (
                  <UserRow
                    key={u.uid}
                    u={u}
                    onView={() =>
                      navigate(`/admin/customers/${u.uid}/tickets`, {
                        state: { name: u.name, email: u.email, from: '/admin' },
                      })
                    }
                  />
                ))}
                {customers.length > 6 && (
                  <Link to="/admin/customers" className="dash-more">View all customers</Link>
                )}
              </div>
            </section>

            <section className="glass panel">
              <header className="panel-head">
                <h2 className="panel-title">Recent agents</h2>
                <span className="muted">{agents.length} total</span>
              </header>
              <div className="dash-user-list">
                {agents.length === 0 && <p className="muted">No agents yet.</p>}
                {agents.slice(0, 6).map((u) => (
                  <UserRow
                    key={u.uid}
                    u={u}
                    onView={() =>
                      navigate(`/admin/agents/${u.uid}/tickets`, {
                        state: { name: u.name, email: u.email, from: '/admin' },
                      })
                    }
                  />
                ))}
                {agents.length > 6 && (
                  <Link to="/admin/agents" className="dash-more">View all agents</Link>
                )}
              </div>
            </section>
          </div>

          <section className="glass panel dash-tickets">
            <header className="panel-head">
              <h2 className="panel-title">Recent tickets</h2>
              <Link to="/admin/tickets" className="dash-more">View all tickets</Link>
            </header>
            <TicketTable
              tickets={recent}
              onSelect={(id) => navigate(`/admin/tickets/${id}`)}
              emptyAction={<p className="muted">No tickets have been raised yet.</p>}
            />
          </section>
        </>
      )}
    </>
  )
}