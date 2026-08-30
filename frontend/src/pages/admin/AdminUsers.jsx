import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../../context/ToastContext'
import LoadingState from '../../components/ui/LoadingState'
import ErrorState from '../../components/ui/ErrorState'
import EmptyState from '../../components/ui/EmptyState'
import StatusBadge from '../../components/ui/StatusBadge'
import PriorityBadge from '../../components/ui/PriorityBadge'
import { api } from '../../lib/api'
import { ROLES } from '../../config/tickets'
import { formatDate, initials } from '../../lib/utils'




export default function AdminUsers({ role }) {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const isCustomers = role === ROLES.CUSTOMER
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [busyUid, setBusyUid] = useState(null)

  
  
  const [overview, setOverview] = useState(null)
  const [overviewLoading, setOverviewLoading] = useState(false)
  const [overviewError, setOverviewError] = useState(null)
  const [showOverview, setShowOverview] = useState(false)
  const [expanded, setExpanded] = useState({})

  const loadOverview = async () => {
    setOverviewLoading(true)
    setOverviewError(null)
    try {
      const data = await api.admin.agentsOverview()
      setOverview(data.agents || [])
    } catch (e) {
      setOverviewError(e.message || 'Could not load agent activity.')
    } finally {
      setOverviewLoading(false)
    }
  }

  const toggleOverview = () => {
    const next = !showOverview
    setShowOverview(next)
    if (next && overview === null) loadOverview()
  }

  const toggleExpand = (uid, key) =>
    setExpanded((prev) => ({ ...prev, [`${uid}-${key}`]: !prev[`${uid}-${key}`] }))

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await api.admin.users(role)
      setUsers(data.users || [])
    } catch (e) {
      setError(e.message || 'Could not load users.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role])

  const act = async (uid, patch, message) => {
    setBusyUid(uid)
    try {
      await api.admin.setUserRole(uid, patch)
      showToast(message, 'success')
      await load()
    } catch (e) {
      showToast(e.message || 'Action failed', 'error')
    } finally {
      setBusyUid(null)
    }
  }

  const roleBadgeTone = (r) => {
    if (r === ROLES.ADMIN) return 'badge-active'
    if (r === ROLES.AGENT) return 'badge-warning'
    return 'badge-neutral'
  }

  return (
    <>
      <div className="page-head">
        <h1>{isCustomers ? 'Customers' : 'Agents'}</h1>
        <p className="muted">
          {isCustomers
            ? 'Customer accounts — promote to agent or disable as needed.'
            : 'Agent accounts — demote to customer, promote to admin, or disable.'}
        </p>
        {!isCustomers && (
          <button
            type="button"
            className="btn btn-sm btn-ghost"
            onClick={toggleOverview}
            disabled={overviewLoading}
          >
            {showOverview
              ? 'Hide discussions & resolve tasks'
              : 'View discussions & resolve tasks'}
          </button>
        )}
      </div>

      {loading && <LoadingState label="Loading users…" />}
      {!loading && error && <ErrorState message={error} onRetry={load} />}
      {!loading && !error && users.length === 0 && (
        <EmptyState
          icon="Users"
          title={isCustomers ? 'No customers yet' : 'No agents yet'}
          message="Users will appear here once they sign up."
        />
      )}
      {!loading && !error && users.length > 0 && (
        <div className="ticket-table-wrap glass">
          <table className="ticket-table users-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Joined</th>
                <th className="users-actions-col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.uid}>
                  <td className="users-name">{u.name || '—'}</td>
                  <td>{u.email}</td>
                  <td>
                    <span className={`badge ${roleBadgeTone(u.role)}`}>{u.role}</span>
                  </td>
                  <td>
                    <span className={`badge ${u.isActive === false ? 'badge-danger' : 'badge-success'}`}>
                      {u.isActive === false ? 'Disabled' : 'Active'}
                    </span>
                  </td>
                  <td>{formatDate(u.createdAt)}</td>
                  <td className="users-actions-col">
                    <div className="users-actions">
                      <button
                        type="button"
                        className="btn btn-sm btn-ghost"
                        disabled={busyUid === u.uid}
                        onClick={() =>
                          navigate(`/admin/${isCustomers ? 'customers' : 'agents'}/${u.uid}/tickets`, {
                            state: {
                              name: u.name,
                              email: u.email,
                              from: isCustomers ? '/admin/customers' : '/admin/agents',
                            },
                          })
                        }
                      >
                        Tickets
                      </button>
                      {isCustomers ? (
                        <button
                          type="button"
                          className="btn btn-sm btn-ghost"
                          disabled={busyUid === u.uid}
                          onClick={() => act(u.uid, { role: ROLES.AGENT }, `${u.email} promoted to agent`) }
                        >
                          Make agent
                        </button>
                      ) : (
                        <>
                          <button
                            type="button"
                            className="btn btn-sm btn-ghost"
                            disabled={busyUid === u.uid}
                            onClick={() => act(u.uid, { role: ROLES.CUSTOMER }, `${u.email} demoted to customer`) }
                          >
                            Make customer
                          </button>
                          {u.role !== ROLES.ADMIN && (
                            <button
                              type="button"
                              className="btn btn-sm btn-ghost"
                              disabled={busyUid === u.uid}
                              onClick={() => act(u.uid, { role: ROLES.ADMIN }, `${u.email} promoted to admin`) }
                            >
                              Make admin
                            </button>
                          )}
                        </>
                      )}
                      <button
                        type="button"
                        className="btn btn-sm btn-ghost"
                        disabled={busyUid === u.uid}
                        onClick={() =>
                          act(
                            u.uid,
                            { isActive: u.isActive === false },
                            u.isActive === false ? `${u.email} re-enabled` : `${u.email} disabled`
                          )
                        }
                      >
                        {u.isActive === false ? 'Re-enable' : 'Disable'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!isCustomers && showOverview && (
        <section className="agents-overview">
          {overviewLoading && <LoadingState label="Loading agent activity…" />}
          {!overviewLoading && overviewError && (
            <ErrorState message={overviewError} onRetry={loadOverview} />
          )}
          {!overviewLoading && !overviewError && overview && overview.length === 0 && (
            <EmptyState
              icon="Users"
              title="No agents yet"
              message="Agent discussions and resolve tasks will appear here once agents exist and take on tickets."
            />
          )}
          {!overviewLoading && !overviewError && overview && overview.length > 0 && (
            <div className="overview-list">
              {overview.map((agent) => {
                const showResolve = expanded[`${agent.uid}-resolve`]
                const showDisc = expanded[`${agent.uid}-disc`]
                return (
                  <div key={agent.uid} className="overview-agent glass">
                    <div className="overview-agent-head">
                      <div className="overview-agent-id">
                        <span className="overview-agent-avatar">{initials(agent.name)}</span>
                        <div>
                          <div className="overview-agent-name">
                            {agent.name || '—'}
                            <span className="badge badge-warning">
                              {agent.stats.resolvedTasks} resolved · {agent.stats.activeDiscussions} active
                            </span>
                          </div>
                          <div className="muted overview-agent-email">{agent.email}</div>
                        </div>
                      </div>
                      <div className="overview-agent-stats">
                        <span>{agent.stats.totalTickets} tickets</span>
                        <span>{agent.stats.totalMessages} msgs</span>
                      </div>
                    </div>

                    <div className="overview-agent-body">
                      <button
                        type="button"
                        className="overview-toggle"
                        onClick={() => toggleExpand(agent.uid, 'disc')}
                      >
                        Discussions ({agent.discussions.length})
                        <span>{showDisc ? '▾' : '▸'}</span>
                      </button>
                      {showDisc && (
                        <div className="overview-panel">
                          {agent.discussions.length === 0 && (
                            <div className="muted">No assigned tickets yet.</div>
                          )}
                          {agent.discussions.map((d) => (
                            <div key={d.id} className="overview-row">
                              <div className="overview-row-main">
                                <span className="overview-row-title">
                                  {d.ticketNumber} — {d.subject || 'Untitled'}
                                </span>
                                <StatusBadge status={d.status} />
                              </div>
                              <div className="muted">
                                {d.messageCount} message{d.messageCount === 1 ? '' : 's'}
                                {d.lastMessageAt ? ` · last ${formatDate(d.lastMessageAt)}` : ''}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      <button
                        type="button"
                        className="overview-toggle"
                        onClick={() => toggleExpand(agent.uid, 'resolve')}
                      >
                        Resolve tasks ({agent.resolveTasks.length})
                        <span>{showResolve ? '▾' : '▸'}</span>
                      </button>
                      {showResolve && (
                        <div className="overview-panel">
                          {agent.resolveTasks.length === 0 && (
                            <div className="muted">No resolved tickets yet.</div>
                          )}
                          {agent.resolveTasks.map((t) => (
                            <div key={t.id} className="overview-row">
                              <div className="overview-row-main">
                                <span className="overview-row-title">
                                  {t.ticketNumber} — {t.subject || 'Untitled'}
                                </span>
                                <StatusBadge status={t.status} />
                                {t.priority && <PriorityBadge priority={t.priority} />}
                              </div>
                              <div className="overview-resolve-note">{t.resolutionNote}</div>
                              {t.resolvedAt && (
                                <div className="muted">Resolved {formatDate(t.resolvedAt)}</div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      )}
    </>
  )
}