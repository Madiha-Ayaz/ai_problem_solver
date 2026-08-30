import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import DashboardCard from '../../components/ui/DashboardCard'
import LoadingState from '../../components/ui/LoadingState'
import ErrorState from '../../components/ui/ErrorState'
import TicketTable from '../../components/tickets/TicketTable'
import { customerStats } from '../../config/app'
import { api } from '../../lib/api'
import { subscribeCustomerTickets } from '../../lib/realtime'
import { useAuth } from '../../context/AuthContext'
import { TICKET_STATUSES } from '../../config/tickets'





export default function CustomerDashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [usingRealtime, setUsingRealtime] = useState(true)
  const ticketsRef = useRef([])

  const recompute = () => {
    const tickets = ticketsRef.current
    const resolved = tickets.filter((t) => t.status === TICKET_STATUSES.RESOLVED).length
    setStats({
      totalCount: tickets.length,
      openCount: tickets.length - resolved,
      resolvedCount: resolved,
      recentTickets: tickets.slice(0, 5),
      computedAt: new Date().toISOString(),
    })
  }

  useEffect(() => {
    if (!user?.uid) return
    let live = true
    setLoading(true)
    setError(null)

    const off = subscribeCustomerTickets(user.uid, {
      next: (docs) => {
        if (!live) return
        ticketsRef.current = docs.length > 100 ? docs.slice(0, 100) : docs
        setUsingRealtime(true)
        setLoading(false)
        setError(null)
        recompute()
      },
      error: (err) => {
        if (!live) return
        console.warn('[CustomerDashboard] realtime unavailable, using REST:', err?.message)
        setUsingRealtime(false)
        api.dashboard
          .customer()
          .then((data) => {
            if (!live) return
            setStats(data.stats)
            setLoading(false)
            setError(null)
          })
          .catch((e) => {
            if (!live) return
            setError(e.message || 'Could not load your dashboard.')
            setLoading(false)
          })
      },
    })

    return () => {
      live = false
      off()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid])

  return (
    <>
      <div className="page-head">
        <h1>Welcome back</h1>
        <p className="muted">
          Track your open requests, review their status and reach your support agent here.
        </p>
        {!loading && usingRealtime && (
          <span className="badge badge-success" style={{ marginTop: 8 }}>
            Live
          </span>
        )}
      </div>

      {loading && <LoadingState label="Loading your dashboard…" />}
      {!loading && error && <ErrorState message={error} />}
      {!loading && !error && (
        <>
          <div className="stat-grid">
            {customerStats.map((s) => (
              <DashboardCard key={s.key} label={s.label} value={stats?.[s.key]} icon={s.icon} />
            ))}
          </div>

          <div className="quick-actions">
            <Link to="/customer/tickets/new" className="btn btn-primary">
              Create a ticket
            </Link>
            <Link to="/customer/tickets" className="btn btn-ghost">
              View my tickets
            </Link>
          </div>

          <section className="section-sm">
            <h2 className="h3">Recent tickets</h2>
            <TicketTable
              tickets={stats?.recentTickets || []}
              onSelect={(id) => navigate(`/customer/tickets/${id}`)}
              emptyAction={
                <Link to="/customer/tickets/new" className="btn btn-primary btn-sm">
                  Create your first ticket
                </Link>
              }
            />
          </section>
        </>
      )}
    </>
  )
}
