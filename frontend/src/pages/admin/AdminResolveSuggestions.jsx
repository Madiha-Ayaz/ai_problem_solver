import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import StatusBadge from '../../components/ui/StatusBadge'
import PriorityBadge from '../../components/ui/PriorityBadge'
import LoadingState from '../../components/ui/LoadingState'
import ErrorState from '../../components/ui/ErrorState'
import EmptyState from '../../components/ui/EmptyState'
import { api } from '../../lib/api'






export default function AdminResolveSuggestions() {
  const navigate = useNavigate()
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await api.admin.allTickets(undefined, 200)
      setTickets(data.tickets || [])
    } catch (e) {
      setError(e.message || 'Could not load suggestions.')
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
        <h1>Resolve suggestions</h1>
        <p className="muted">
          The suggested resolution path for every ticket — from the AI triage,
          refined by agents before closing.
        </p>
      </div>

      {loading && <LoadingState label="Loading suggestions…" />}
      {!loading && error && <ErrorState message={error} onRetry={load} />}
      {!loading && !error && tickets.length === 0 && (
        <EmptyState
          icon="Sparkles"
          title="No tickets yet"
          message="Once customers raise tickets, their resolution suggestions appear here."
        />
      )}
      {!loading && !error && tickets.length > 0 && (
        <div className="resolve-grid">
          {tickets.map((t) => {
            const s = t.aiSuggestion || {}
            const pathText = t.summary || s.summary || ''
            const pathCategory = t.category || s.category || 'Other'
            const pathPriority = t.priority || s.priority || 'MEDIUM'
            return (
              <article
                key={t.id}
                className="glass resolve-card"
                role="button"
                tabIndex={0}
                onClick={() => navigate(`/admin/tickets/${t.id}`)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    navigate(`/admin/tickets/${t.id}`)
                  }
                }}
              >
                <header className="resolve-card-head">
                  <span className="resolve-number">
                    {t.ticketNumber || t.number || t.id}
                  </span>
                  <StatusBadge status={t.status} />
                </header>

                <h3 className="resolve-subject">{t.subject || t.summary || 'Untitled ticket'}</h3>

                <div className="resolve-card-badges">
                  <span className="badge badge-neutral">{pathCategory}</span>
                  <PriorityBadge priority={pathPriority} />
                  {t.aiReviewed && <span className="badge badge-success">AI reviewed</span>}
                </div>

                {pathText && (
                  <div className="ai-suggestions">
                    <div className="suggestion suggestion-wide">
                      <span className="suggestion-label">Suggested resolution path</span>
                      <p>{pathText}</p>
                    </div>
                  </div>
                )}

                {t.status === 'RESOLVED' && t.resolutionNote && (
                  <div className="resolution-note">
                    <strong>Resolution</strong>
                    <p>{t.resolutionNote}</p>
                  </div>
                )}

                <footer className="resolve-card-foot">
                  <span>View ticket &rarr;</span>
                </footer>
              </article>
            )
          })}
        </div>
      )}
    </>
  )
}