import { useState } from 'react'
import { Send } from 'lucide-react'



export default function MessageComposer({ onSend, disabled, placeholder = 'Type a message…' }) {
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    const text = body.trim()
    if (!text || sending || disabled) return
    setSending(true)
    try {
      if (onSend) await onSend(text)
      setBody('')
    } finally {
      setSending(false)
    }
  }

  return (
    <form className="composer" onSubmit={submit}>
      <textarea
        className="composer-input"
        rows={2}
        value={body}
        placeholder={placeholder}
        onChange={(e) => setBody(e.target.value)}
        disabled={disabled}
      />
      <button
        type="submit"
        className="btn btn-primary"
        disabled={!body.trim() || sending || disabled}
      >
        <Send size={16} /> {sending ? 'Sending…' : 'Send'}
      </button>
    </form>
  )
}