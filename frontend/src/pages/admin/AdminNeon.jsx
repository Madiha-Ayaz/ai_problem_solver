import { useEffect, useState } from 'react'
import { Database, RefreshCw, CheckCircle2, XCircle } from 'lucide-react'
import StatusBadge from '../../components/ui/StatusBadge'
import PriorityBadge from '../../components/ui/PriorityBadge'
import LoadingState from '../../components/ui/LoadingState'
import ErrorState from '../../components/ui/ErrorState'
import EmptyState from '../../components/ui/EmptyState'
import { useToast } from '../../context/ToastContext'
import { api } from '../../lib/api'
import { formatDate } from '../../lib/utils'






export default function AdminNeon() {
  const { showToast } = useToast()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [syncing, setSyncing] = useState(false)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.admin.neon()
      setData(res)
    } catch (e) {
      setError(e.message || 'Could not reach the Neon mirror.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const sync = async () => {
    setSyncing(true)
    try {
      const res = await api.admin.neonSync()
      showToast(
        `Neon updated: ${res.users || 0} users, ${res.tickets || 0} tickets, ${res.messages || 0} messages.`,
        'success'
      )
      await load()
    } catch (e) {
      showToast(e.message || 'Sync failed.', 'error')
    } finally {
      setSyncing(false)
    }
  }

  const countCards = data && data.counts ? data.counts : {}

  return (
    <>
      <div className="page-head page-head-row">
        <div>
          <h1>Neon Database</h1>
          <p className="muted">
            Every write is mirrored to the Neon (PostgreSQL) database — chat, AI
            suggestions and all records stay fully connected.
          </p>
        </div>
        <button type="button" className="btn btn-primary" onClick={sync} disabled={syncing || loading}>
          <RefreshCw size={16} className={syncing ? 'spin' : ''} />
          {syncing ? 'Syncing…' : 'Sync from Firestore'}
        </button>
      </div>

      {loading && <LoadingState label="Reading Neon mirror…" />}
      {!loading && error && <ErrorState message={error} onRetry={load} />}
      {!loading && !error && data && (
        <>
          <div className="dash-grid">
            <div className="stat-card glass">
              <span className="stat-label">Neon connection</span>
              <span className="stat-value">
                {data.connected ? (
                  <span className="conn-on">
                    <CheckCircle2 size={18} /> Connected
                  </span>
                ) : (
                  <span className="conn-off">
                    <XCircle size={18} /> Disconnected
                  </span>
                )}
              </span>
              <p className="muted">
                {data.connected
                  ? 'The app is writing straight into the Neon database.'
                  : 'Set DATABASE_URL in backend/.env to sync — the app still works.'}
              </p>
            </div>
            <div className="stat-card glass">
              <span className="stat-label">Users</span>
              <span className="stat-value">{countCards.users ?? 0}</span>
            </div>
            <div className="stat-card glass">
              <span className="stat-label">Tickets (+ AI)</span>
              <span className="stat-value">{countCards.tickets ?? 0}</span>
            </div>
            <div className="stat-card glass">
              <span className="stat-label">Chat messages</span>
              <span className="stat-value">{countCards.messages ?? 0}</span>
            </div>
          </div>

          <section className="glass panel neon-section">
            <h2 className="h3">
              <Database size={17} /> Recent tickets
            </h2>
            {data.tickets && data.tickets.length ? (
              <table className="neon-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Subject</th>
                    <th>Category</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>AI</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {data.tickets.map((t) => (
                    <tr key={t.id}>
                      <td className="cell-strong">{t.ticketNumber || t.id}</td>
                      <td title={t.subject}>{t.subject}</td>
                      <td>{t.category || '—'}</td>
                      <td>{t.priority ? <PriorityBadge priority={t.priority} /> : '—'}</td>
                      <td>{t.status ? <StatusBadge status={t.status} /> : '—'}</td>
                      <td>{t.aiReviewed ? 'reviewed' : t.aiSuggestion ? 'suggested' : '—'}</td>
                      <td className="cell-muted">{formatDate(t.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <EmptyState
                icon="Database"
                title="No tickets in Neon yet"
                message="Create a ticket (or press Sync now) to list it here with its AI suggestion."
              />
            )}
          </section>

          <section className="glass panel neon-section">
            <h2 className="h3">
              <Database size={17} /> Users
            </h2>
            {data.users && data.users.length ? (
              <table className="neon-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Active</th>
                    <th>Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {data.users.map((u) => (
                    <tr key={u.uid}>
                      <td className="cell-strong">{u.name || u.uid}</td>
                      <td>{u.email || '—'}</td>
                      <td>{u.role || '—'}</td>
                      <td>{u.isActive ? 'yes' : 'no'}</td>
                      <td className="cell-muted">{formatDate(u.updatedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <EmptyState icon="Users" title="No users in Neon yet" message="Sign-ins get mirrored automatically." />
            )}
          </section>

          <section className="glass panel neon-section">
            <h2 className="h3">
              <Database size={17} /> Chat messages
            </h2>
            {data.messages && data.messages.length ? (
              <table className="neon-table">
                <thead>
                  <tr>
                    <th>Sender</th>
                    <th>Message</th>
                    <th>Ticket</th>
                    <th>Sent</th>
                  </tr>
                </thead>
                <tbody>
                  {data.messages.map((m) => (
                    <tr key={m.id}>
                      <td className="cell-strong">{m.authorName || m.senderRole || m.senderId || '—'}</td>
                      <td title={m.message}>{m.message}</td>
                      <td className="cell-muted">{m.ticketId ? m.ticketId.slice(0, 8) : '—'}</td>
                      <td className="cell-muted">{formatDate(m.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <EmptyState
                icon="MessageSquare"
                title="No chat in Neon yet"
                message="Conversation messages (including AI replies) are mirrored here as they are sent."
              />
            )}
          </section>
        </>
      )}
    </>
  )
}