import StatusBadge from '../ui/StatusBadge'
import PriorityBadge from '../ui/PriorityBadge'
import EmptyState from '../ui/EmptyState'
import { formatDate, ticketNumber } from '../../lib/utils'



export default function TicketTable({ tickets = [], onSelect, emptyAction, showSuggestion }) {
  if (tickets.length === 0) {
    return (
      <EmptyState
        title="No tickets yet"
        message="When tickets exist in the database they will appear here."
        icon="Tickets"
        action={emptyAction}
      />
    )
  }

  return (
    <div className="ticket-table-wrap glass">
      <table className="ticket-table">
        <thead>
          <tr>
            <th>Ticket</th>
            <th>Subject</th>
            <th>Category</th>
            <th>Priority</th>
            <th>Status</th>
            <th>Updated</th>
          </tr>
        </thead>
        <tbody>
          {tickets.map((ticket) => (
            <tr
              key={ticket.id}
              className="ticket-row"
              onClick={() => onSelect && onSelect(ticket.id)}
              tabIndex={0}
              role="link"
              onKeyDown={(e) => {
                if ((e.key === 'Enter' || e.key === ' ') && onSelect) {
                  e.preventDefault()
                  onSelect(ticket.id)
                }
              }}
            >
              <td className="ticket-number">{ticket.ticketNumber || ticket.number || ticketNumber(ticket.id)}</td>
              <td className="ticket-subject">
                {ticket.subject || ticket.summary || '—'}
                {showSuggestion && ticket.aiSuggestion && (
                  <span className="ticket-ai-sub">
                    AI: {ticket.aiSuggestion.summary || ticket.aiSuggestion.category || ''}
                  </span>
                )}
              </td>
              <td>{ticket.category || '—'}</td>
              <td><PriorityBadge priority={ticket.priority} /></td>
              <td><StatusBadge status={ticket.status} /></td>
              <td>{formatDate(ticket.updatedAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}