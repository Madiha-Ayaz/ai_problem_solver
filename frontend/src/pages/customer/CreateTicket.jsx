import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Send, Info, Sparkles, Plus, FolderOpen } from 'lucide-react'
import { useToast } from '../../context/ToastContext'
import { CATEGORIES } from '../../config/tickets'
import { api } from '../../lib/api'
import { TextField, TextAreaField, SelectField } from '../../components/forms/FormField'

export default function CreateTicket() {
  const { showToast } = useToast()
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)
  const [submitted, setSubmitted] = useState(null)
  const [form, setForm] = useState({ subject: '', category: '', description: '' })

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    try {
      const res = await api.createTicket(form)
      setSubmitted({ ticketNumber: res.ticketNumber, suggestion: res.suggestion })
      showToast('Ticket submitted successfully.', 'success')
    } catch (err) {
      showToast(err.message || 'Could not submit ticket.', 'error')
    } finally {
      setBusy(false)
    }
  }

  const reset = () => {
    setSubmitted(null)
    setForm({ subject: '', category: '', description: '' })
  }

  if (submitted) {
    return (
      <>
        <div className="page-head">
          <h1>Ticket submitted</h1>
          <p className="muted">Your ticket {submitted.ticketNumber} was created successfully.</p>
        </div>

        <div className="glass form-card">
          <div className="success-icon-row">
            <div className="success-halo">
              <Sparkles size={22} />
            </div>
          </div>

          {submitted.suggestion ? (
            <div className="ai-suggestion-panel">
              <p className="ai-suggestion-title">
                <Sparkles size={15} /> AI auto-triage
              </p>
              <div className="ai-triage-chips">
                <div className="ai-chip">
                  <span className="ai-chip-label">Category</span>
                  <strong>{submitted.suggestion.category}</strong>
                </div>
                <div className="ai-chip">
                  <span className="ai-chip-label">Priority</span>
                  <strong>{submitted.suggestion.priority}</strong>
                </div>
              </div>
              <div className="ai-suggestion-cell ai-suggestion-wide">
                <span className="ai-suggestion-label">Summary</span>
                <span>{submitted.suggestion.summary}</span>
              </div>
              <div className="ai-suggestion-cell ai-suggestion-wide">
                <span className="ai-suggestion-label">Recommended next step</span>
                <span>{submitted.suggestion.recommendation || 'A support agent will determine the next step.'}</span>
              </div>
              <p className="muted ai-suggestion-note">
                A support agent will review this triage before acting on it.
              </p>
            </div>
          ) : (
            <p className="muted">
              AI suggestion is unavailable right now. Your ticket was still created and a support
              agent will triage it manually.
            </p>
          )}

          <div className="form-actions">
            <button type="button" className="btn btn-primary" onClick={() => navigate('/customer/tickets')}>
              <FolderOpen size={16} /> My tickets
            </button>
            <button type="button" className="btn btn-ghost" onClick={reset}>
              <Plus size={16} /> Create another
            </button>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <div className="page-head">
        <h1>Create a ticket</h1>
        <p className="muted">
          Describe your issue — the AI will produce a professional category, priority, summary and
          recommended next step that a support agent can review.
        </p>
      </div>

      <form className="glass form-card" onSubmit={submit}>
        <TextField label="Subject" required name="subject" placeholder="Short summary of the problem" value={form.subject} onChange={set('subject')} />

        <SelectField
          label="Category"
          required
          name="category"
          placeholder="Select a category"
          options={CATEGORIES}
          value={form.category}
          onChange={set('category')}
        />

        <TextAreaField
          label="Description"
          required
          name="description"
          placeholder="Describe the issue in detail. Include steps to reproduce if possible."
          rows={6}
          value={form.description}
          onChange={set('description')}
        />

        <div className="form-note">
          <Info size={15} /> Priority is suggested automatically by AI and can be adjusted by an agent.
        </div>

        <div className="form-actions">
          <Link to="/customer/tickets" className="btn btn-ghost">Cancel</Link>
          <button type="submit" className="btn btn-primary" disabled={busy}>
            <Send size={16} /> {busy ? 'Submitting…' : 'Submit ticket'}
          </button>
        </div>
      </form>
    </>
  )
}