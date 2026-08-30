import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Sparkles } from 'lucide-react'
import TicketDetails from '../../components/tickets/TicketDetails'
import MessageList from '../../components/messages/MessageList'
import MessageComposer from '../../components/messages/MessageComposer'
import LoadingState from '../../components/ui/LoadingState'
import ErrorState from '../../components/ui/ErrorState'
import { useAuth } from '../../context/AuthContext'
import { useTicket, useTicketMessages } from '../../hooks/useRealtime'
import { api } from '../../lib/api'
import { useToast } from '../../context/ToastContext'


export default function TicketDetailsPage() {
  const { ticketId } = useParams()
  const { user } = useAuth()
  const { showToast } = useToast()
  const [checked, setChecked] = useState(false)
  const [initError, setInitError] = useState(null)

  const ticket = useTicket(ticketId)
  const messages = useTicketMessages(ticketId)

  
  useEffect(() => {
    if (checked || !user) return
    api
      .getTicket(ticketId)
      .then(() => setChecked(true))
      .catch((e) => setInitError(e.message || 'Could not load this ticket.'))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checked, user])

  const send = async (text) => {
    try {
      await api.messages.send(ticketId, text)
    } catch (e) {
      showToast(e.message || 'Could not send message.', 'error')
      throw e
    }
  }

  const loading = ticket.loading || messages.loading || (!checked && !initError)
  const error = initError || ticket.error?.message || messages.error?.message

  return (
    <>
      <div className="page-head page-head-row">
        <div>
          <Link to="/customer/tickets" className="back-link">
            <ArrowLeft size={16} /> My Tickets
          </Link>
          <h1>Ticket {ticket.data?.ticketNumber || ticketId || ''}</h1>
          <p className="muted">Track status and chat with the assigned agent.</p>
        </div>
      </div>

      {loading && <LoadingState label="Loading ticket…" />}
      {!loading && error && <ErrorState message={error} />}
      {!loading && !error && ticket.data && (
        <div className="ticket-room">
          <div className="ticket-room-main">
            <TicketDetails ticket={ticket.data} />

            {ticket.data.aiSuggestion && (
              <section className="glass panel ai-panel">
                <h2 className="h3 ai-title">
                  <Sparkles size={17} /> AI suggestion
                </h2>
                <div className="ai-suggestions">
                  <div className="suggestion">
                    <span className="suggestion-label">Category</span>
                    <strong>{ticket.data.aiSuggestion.category || '—'}</strong>
                  </div>
                  <div className="suggestion">
                    <span className="suggestion-label">Priority</span>
                    <strong>{ticket.data.aiSuggestion.priority || '—'}</strong>
                  </div>
                  <div className="suggestion suggestion-wide">
                    <span className="suggestion-label">Summary</span>
                    <p>{ticket.data.aiSuggestion.summary || '—'}</p>
                  </div>
                </div>
              </section>
            )}
          </div>

          <section className="glass panel thread">
            <h2 className="h3">Messages</h2>
            <MessageList
              messages={messages.data || []}
              currentUserId={user?.uid}
              loading={messages.loading}
            />
            <MessageComposer
              disabled={ticket.data.status === 'RESOLVED'}
              placeholder={
                ticket.data.status === 'RESOLVED'
                  ? 'This ticket is resolved — create a new ticket for new issues.'
                  : 'Type a message to the agent…'
              }
              onSend={send}
            />
          </section>
        </div>
      )}
    </>
  )
}