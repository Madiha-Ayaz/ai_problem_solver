import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Sparkles, Copy } from 'lucide-react'
import TicketDetails from '../../components/tickets/TicketDetails'
import MessageList from '../../components/messages/MessageList'
import LoadingState from '../../components/ui/LoadingState'
import ErrorState from '../../components/ui/ErrorState'
import { api } from '../../lib/api'



export default function AdminTicketDetails() {
  const { ticketId } = useParams()
  const navigate = useNavigate()
  const [ticket, setTicket] = useState(null)
  const [messages, setMessages] = useState([])
  const [similar, setSimilar] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const [t, m] = await Promise.all([
        api.admin.getTicket(ticketId),
        api.messages.list(ticketId).catch(() => ({ messages: [] })),
        api.admin.similarTickets(ticketId).catch(() => ({ similar: [] })),
      ])
      setTicket(t.ticket)
      setMessages(m.messages || [])
      setSimilar(t.similar || [])
    } catch (e) {
      setError(e.message || 'Could not load this ticket.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketId])

  return (
    <>
      <div className="page-head page-head-row">
        <div>
          <Link to="/admin/tickets" className="back-link">
            <ArrowLeft size={16} /> All tickets
          </Link>
          <h1>Ticket {ticket?.ticketNumber || ticketId || ''}</h1>
          <p className="muted">Supervisor view — details and conversation (read-only).</p>
        </div>
      </div>

      {loading && <LoadingState label="Loading ticket…" />}
      {!loading && error && <ErrorState message={error} onRetry={load} />}
      {!loading && !error && ticket && (
        <div className="ticket-room">
          <div className="ticket-room-main">
            <TicketDetails ticket={ticket} />

            {ticket.aiSuggestion && (
              <section className="glass panel ai-panel">
                <h2 className="h3 ai-title">
                  <Sparkles size={17} /> AI suggestion
                </h2>
                <div className="ai-suggestions">
                  <div className="suggestion">
                    <span className="suggestion-label">Category</span>
                    <strong>{ticket.aiSuggestion.category || '—'}</strong>
                  </div>
                  <div className="suggestion">
                    <span className="suggestion-label">Priority</span>
                    <strong>{ticket.aiSuggestion.priority || '—'}</strong>
                  </div>
                  <div className="suggestion suggestion-wide">
                    <span className="suggestion-label">Summary</span>
                    <p>{ticket.aiSuggestion.summary || '—'}</p>
                  </div>
                </div>
              </section>
            )}

            {similar.length > 0 && (
              <section className="glass panel ai-panel">
                <h2 className="h3 ai-title">
                  <Copy size={17} /> Similar / duplicate tickets
                </h2>
                <p className="muted">
                  Open tickets that look close to this one — useful before resolving.
                </p>
                <div className="similar-list">
                  {similar.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      className="similar-row"
                      onClick={() => navigate(`/admin/tickets/${s.id}`)}
                    >
                      <span className="resolve-number">{s.ticketNumber || s.id}</span>
                      <span className="similar-subject">{s.subject || 'Untitled ticket'}</span>
                      <span className="badge badge-neutral">{s.category || '—'}</span>
                      <span className="badge badge-info">{s.status}</span>
                    </button>
                  ))}
                </div>
              </section>
            )}
          </div>

          <section className="glass panel thread">
            <h2 className="h3">Conversation</h2>
            <MessageList messages={messages} loading={false} />
          </section>
        </div>
      )}
    </>
  )
}