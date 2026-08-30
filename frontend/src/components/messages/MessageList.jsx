import EmptyState from '../ui/EmptyState'
import { formatDate, initials, cx } from '../../lib/utils'




export default function MessageList({ messages = [], currentUserId = '', loading }) {
  if (loading) return null

  if (messages.length === 0) {
    return (
      <EmptyState
        title="No messages yet"
        message="Replies between the customer and the assigned agent will appear here."
        icon="MessageSquare"
      />
    )
  }

  return (
    <ol className="message-list">
      {messages.map((msg) => {
        const isAi = msg.senderRole === 'ai' || msg.senderId === 'ai'
        const mine = currentUserId && msg.senderId === currentUserId
        const author = isAi ? msg.authorName || 'SupportFlow AI' : mine ? 'You' : msg.authorName || 'Support'
        return (
          <li
            key={msg.id}
            className={cx('message', mine && 'message-mine', isAi && 'message-ai')}
          >
            <div className="message-bubble glass">
              <p className="message-text">{msg.message || msg.body}</p>
              <span className="message-meta">
                {isAi && <span className="ai-tag">AI</span>}
                {author} · {formatDate(msg.createdAt)}
              </span>
            </div>
          </li>
        )
      })}
    </ol>
  )
}