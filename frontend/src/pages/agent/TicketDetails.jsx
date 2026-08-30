import { useEffect, useRef, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Sparkles, Save, Hand, CheckCircle, RotateCcw } from 'lucide-react'
import TicketDetails from '../../components/tickets/TicketDetails'
import MessageList from '../../components/messages/MessageList'
import MessageComposer from '../../components/messages/MessageComposer'
import LoadingState from '../../components/ui/LoadingState'
import ErrorState from '../../components/ui/ErrorState'
import { SelectField, TextAreaField } from '../../components/forms/FormField'
import { TICKET_FLOW, TICKET_STATUSES } from '../../config/tickets'
import { useAuth } from '../../context/AuthContext'
import { useTicket, useTicketMessages } from '../../hooks/useRealtime'
import { api } from '../../lib/api'
import { useToast } from '../../context/ToastContext'

function SuggestionCard({ label, children }) {
  return (
    <div className="suggestion">
      <span className="suggestion-label">{label}</span>
      {children}
    </div>
  )
}



export default function AgentTicketDetails() {
  const { ticketId } = useParams()
  const { user } = useAuth()
  const { showToast } = useToast()

  const ticket = useTicket(ticketId)
  const messages = useTicketMessages(ticketId)
  const data = ticket.data

  
  const [draft, setDraft] = useState({ category: '', priority: '', summary: '', recommendation: '' })
  const [statusSel, setStatusSel] = useState('')
  const [resolveNote, setResolveNote] = useState('')
  const [busy, setBusy] = useState('') 
  
  
  
  const seededId = useRef(null)

  const setField = (key) => (e) => setDraft((d) => ({ ...d, [key]: e.target.value }))

  
  useEffect(() => {
    if (!data || seededId.current === ticketId) return
    seededId.current = ticketId
    setDraft({
      category: data.category || '',
      priority: data.priority || '',
      summary: data.summary || '',
      recommendation: data.recommendation || data.aiSuggestion?.recommendation || '',
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketId, data])

  const run = async (key, fn, successMsg) => {
    setBusy(key)
    try {
      const res = await fn()
      if (successMsg) showToast(successMsg, 'success')
      return res
    } catch (e) {
      showToast(e.message || 'Action failed', 'error')
      return null
    } finally {
      setBusy('')
    }
  }

  const claim = () =>
    run('claim', async () => {
      const res = await api.agent.update(ticketId, { assignedAgentId: user.uid })
      showToast(`Ticket ${res.ticket?.ticketNumber || ''} claimed`, 'success')
      return res
    })

  const saveReview = () =>
    run('save', async () => {
      const res = await api.agent.update(ticketId, draft)
      setDraft({
        category: res.ticket.category || '',
        priority: res.ticket.priority || '',
        summary: res.ticket.summary || '',
        recommendation: res.ticket.recommendation || '',
      })
      return res
    }, 'AI suggestions reviewed and saved.')

  const changeStatus = (e) => {
    const next = e.target.value
    if (!next) return
    setStatusSel('')
    run('status', async () => api.agent.update(ticketId, { status: next }), `Status changed to ${next}`)
  }

  const resolveTicket = (e) => {
    e.preventDefault()
    const note = resolveNote.trim()
    if (!note) return
    run('resolve', async () => api.agent.resolve(ticketId, note), 'Ticket resolved.')
  }

  const sendMessage = async (text) => {
    try {
      await api.messages.send(ticketId, text)
    } catch (e) {
      showToast(e.message || 'Could not send message.', 'error')
      throw e
    }
  }

  const reopenTicket = () =>
    run(
      'reopen',
      async () => {
        const res = await api.agent.reopen(ticketId)
        showToast(`Ticket ${res.ticket?.ticketNumber || ''} reopened`, 'success')
        return res
      },
      undefined
    )

  const loading = ticket.loading || messages.loading
  const error = ticket.error?.message || messages.error?.message
  const nextStatuses = data ? TICKET_FLOW[data.status] || [] : []
  const isNew = data?.status === TICKET_STATUSES.NEW
  const unassigned = data && !data.assignedAgentId
  const canResolve = data && data.status !== TICKET_STATUSES.RESOLVED && nextStatuses.includes(TICKET_STATUSES.RESOLVED)

  return (
    <>
      <div className="page-head page-head-row">
        <div>
          <Link to="/agent/tickets" className="back-link">
            <ArrowLeft size={16} /> Ticket queue
          </Link>
          <h1>Ticket {data?.ticketNumber || ticketId || ''}</h1>
          <p className="muted">Review AI suggestions, reply, and manage status.</p>
        </div>
      </div>

      {loading && <LoadingState label="Loading ticket…" />}
      {!loading && error && <ErrorState message={error} />}
      {!loading && !error && data && (
        <div className="ticket-room">
          <div className="ticket-room-main">
            <TicketDetails ticket={data} />

            {unassigned && isNew && (
              <div className="glass panel">
                <div className="claim-row">
                  <button type="button" className="btn btn-primary" disabled={busy === 'claim'} onClick={claim}>
                    <Hand size={16} /> {busy === 'claim' ? 'Claiming…' : 'Claim this ticket'}
                  </button>
                  <p className="muted">Claiming assigns the ticket to you and moves it to Assigned.</p>
                </div>
              </div>
            )}

            <section className="glass panel ai-panel">
              <h2 className="h3 ai-title">
                <Sparkles size={17} /> AI suggestions
              </h2>
              <div className="ai-suggestions">
                <SuggestionCard label="Category">
                  <input
                    className="field"
                    value={draft.category}
                    onChange={setField('category')}
                    placeholder="AI-suggested category (editable)"
                    aria-label="AI suggested category (editable)"
                  />
                </SuggestionCard>
                <SuggestionCard label="Priority">
                  <input
                    className="field"
                    value={draft.priority}
                    onChange={setField('priority')}
                    placeholder="AI-suggested priority (editable)"
                    aria-label="AI suggested priority (editable)"
                  />
                </SuggestionCard>
                <SuggestionCard label="Short summary">
                  <input
                    className="field"
                    value={draft.summary}
                    onChange={setField('summary')}
                    placeholder="AI-suggested summary (editable)"
                    aria-label="AI suggested summary (editable)"
                  />
                </SuggestionCard>
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn-primary" disabled={busy === 'save'} onClick={saveReview}>
                  <Save size={16} /> {busy === 'save' ? 'Saving…' : 'Save review'}
                </button>
              </div>
            </section>
          </div>

          <section className="glass panel thread">
            <h2 className="h3">Conversation</h2>
            <MessageList messages={messages.data || []} currentUserId={user?.uid} loading={messages.loading} />

            {data.status === 'RESOLVED' && (
              <div className="resolved-banner">
                <p className="muted">This ticket is resolved — the thread is locked.</p>
                <button
                  type="button"
                  className="btn btn-sm btn-ghost"
                  disabled={busy === 'reopen'}
                  onClick={reopenTicket}
                >
                  <RotateCcw size={14} /> {busy === 'reopen' ? 'Reopening…' : 'Reopen ticket'}
                </button>
              </div>
            )}

            <MessageComposer
              placeholder={
                data.status === 'RESOLVED'
                  ? 'Ticket is resolved — no new replies.'
                  : unassigned && isNew
                  ? 'Reply to claim this ticket and help the customer…'
                  : 'Reply to the customer…'
              }
              disabled={data.status === 'RESOLVED' || busy === 'msg'}
              onSend={sendMessage}
            />

            <div className="status-bar">
              <div className="status-actions">
                <SelectField
                  label="Status"
                  name="statusChange"
                  value={statusSel}
                  placeholder={nextStatuses.length ? 'Change status…' : 'No status changes available'}
                  options={nextStatuses}
                  onChange={changeStatus}
                  disabled={!nextStatuses.length || busy === 'status'}
                />
                {unassigned && !isNew && (
                  <p className="muted form-hint">Assigned to you — resolve or move it forward.</p>
                )}
              </div>

              {canResolve && (
                <form className="resolve-form" onSubmit={resolveTicket}>
                  <TextAreaField
                    label="Resolution note"
                    name="resolutionNote"
                    required
                    rows={3}
                    placeholder="Explain how the issue was resolved…"
                    value={resolveNote}
                    onChange={(e) => setResolveNote(e.target.value)}
                  />
                  <div className="form-actions">
                    <button type="submit" className="btn btn-primary" disabled={busy === 'resolve' || !resolveNote.trim()}>
                      <CheckCircle size={16} /> {busy === 'resolve' ? 'Resolving…' : 'Mark as resolved'}
                    </button>
<SuggestionCard label="Recommended next step">
                  <input
                    className="field"
                    value={draft.recommendation}
                    onChange={setField('recommendation')}
                    placeholder="AI-suggested next step (editable)"
                    aria-label="AI suggested next step (editable)"
                  />
                </SuggestionCard>
              </div>
                </form>
              )}
            </div>
          </section>
        </div>
      )}
    </>
  )
}