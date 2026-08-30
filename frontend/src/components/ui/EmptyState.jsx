import AppIcon from './AppIcon'


export default function EmptyState({ title = 'Nothing here yet', message, icon = 'Inbox', action }) {
  return (
    <div className="state state-empty">
      <div className="state-empty-icon">
        <AppIcon name={icon} size={24} />
      </div>
      <span className="state-empty-title">{title}</span>
      {message && <span className="state-empty-msg">{message}</span>}
      {action}
    </div>
  )
}