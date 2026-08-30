import StatusBadge from '../ui/StatusBadge'
import PriorityBadge from '../ui/PriorityBadge'
import { formatDate, ticketNumber } from '../../lib/utils'



export default function TicketDetails({ ticket }) {
  if (!ticket) return null

  const rows = [
    { label: 'Ticket number', value: ticket.number || ticketNumber(ticket.id) },
    { label: 'Created', value: formatDate(ticket.createdAt) },
    { label: 'Last updated', value: formatDate(ticket.updatedAt) },
    { label: 'Category', value: ticket.category || '—' },
    { label: 'Priority', value: <PriorityBadge priority={ticket.priority} /> },
    { label: 'Status', value: <StatusBadge status={ticket.status} /> },
    { label: 'Assigned agent', value: ticket.assignedAgentName || (ticket.assignedAgentId ? 'Assigned' : 'Unassigned') },
  ]

  return (
    <section className="glass panel">
      <header className="panel-head">
        <h2 className="panel-title">
          {ticket.subject || ticket.summary || 'Untitled ticket'}
        </h2>
        {ticket.category && <span className="panel-cat">{ticket.category}</span>}
      </header>

      {ticket.description && (
        <p className="panel-desc">{ticket.description}</p>
      )}

      <dl className="panel-meta">
        {rows.map((row) => (
          <div key={row.label} className="panel-meta-row">
            <dt>{row.label}</dt>
            <dd>{row.value}</dd>
          </div>
        ))}
      </dl>

      {ticket.status === 'RESOLVED' && ticket.resolutionNote && (
        <div className="resolution-note">
          <strong>Resolution</strong>
          <p>{ticket.resolutionNote}</p>
        </div>
      )}
    </section>
  )
}