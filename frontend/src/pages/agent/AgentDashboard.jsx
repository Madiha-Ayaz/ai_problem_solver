import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import DashboardCard from '../../components/ui/DashboardCard'
import LoadingState from '../../components/ui/LoadingState'
import ErrorState from '../../components/ui/ErrorState'
import TicketTable from '../../components/tickets/TicketTable'
import { agentStats } from '../../config/app'
import { api } from '../../lib/api'
import { subscribeAgentAssigned, subscribePool } from '../../lib/realtime'
import { useAuth } from '../../context/AuthContext'
import { TICKET_STATUSES } from '../../config/tickets'






export default function AgentDashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [usingRealtime, setUsingRealtime] = useState(true)
  const assignedRef = useRef([])
  const poolRef = useRef([])

  const recompute = () => {
    const assigned = assignedRef.current
    const pool = poolRef.current
    const resolved = assigned.filter((t) => t.status === TICKET_STATUSES.RESOLVED).length
    const recent = [...assigned].sort((a, b) =>
      (b.updatedAt || b.createdAt || '') < (a.updatedAt || a.createdAt || '') ? -1 : 1
    ).slice(0, 5)
    setStats({
      assignedCount: assigned.length,
      openCount: assigned.length - resolved,
      resolvedCount: resolved,
      poolCount: pool.length,
      recentTickets: recent,
      computedAt: new Date().toISOString(),
    })
  }

  useEffect(() => {
    if (!user?.uid) return
    let live = true
    setLoading(true)
    setError(null)

    
    
    const cap = (list, n) => (list.length > n ? list.slice(0, n) : list)

    const offAssigned = subscribeAgentAssigned(user.uid, {
      next: (docs) => {
        if (!live) return
        assignedRef.current = cap(docs, 200)
        setUsingRealtime(true)
        setLoading(false)
        setError(null)
        recompute()
      },
      error: (err) => {
        if (!live) return
        assignedRef.current = []
        poolRef.current = []
        void fallbackToRest(err)
      },
    })

    const offPool = subscribePool({
      next: (docs) => {
        if (!live) return
        poolRef.current = cap(docs, 500)
        setUsingRealtime(true)
        setLoading(false)
        setError(null)
        recompute()
      },
      error: (err) => {
        if (!live) return
        void fallbackToRest(err)
      },
    })

    async function fallbackToRest(err) {
      console.warn('[AgentDashboard] realtime unavailable, using REST:', err?.message)
      setUsingRealtime(false)
      try {
        const data = await api.dashboard.agent()
        if (!live) return
        setStats(data.stats)
        setLoading(false)
        setError(null)
      } catch (e) {
        if (!live) return
        setError(e.message || 'Could not load your dashboard.')
        setLoading(false)
      }
    }

    return () => {
      live = false
      offAssigned()
      offPool()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid])

  return (
    <>
      <div className="page-head">
        <h1>Agent dashboard</h1>
        <p className="muted">
          Review AI-suggested triage, take ownership of tickets and resolve requests faster.
        </p>
        {!loading && usingRealtime && (
          <span className="badge badge-success" style={{ marginTop: 8 }}>
            Live
          </span>
        )}
      </div>

      {loading && <LoadingState label="Loading your dashboard…" />}
      {!loading && error && <ErrorState message={error} onRetry={() => undefined} />}
      {!loading && !error && (
        <>
          <div className="stat-grid">
            {agentStats.map((s) => (
              <DashboardCard key={s.key} label={s.label} value={stats?.[s.key]} icon={s.icon} />
            ))}
          </div>

          <div className="quick-actions">
            <Link to="/agent/tickets" className="btn btn-primary">Open ticket queue</Link>
          </div>

          <section className="section-sm">
            <h2 className="h3">Your recent tickets</h2>
            <TicketTable
              tickets={stats?.recentTickets || []}
              onSelect={(id) => navigate(`/agent/tickets/${id}`)}
            />
          </section>
        </>
      )}
    </>
  )
}
