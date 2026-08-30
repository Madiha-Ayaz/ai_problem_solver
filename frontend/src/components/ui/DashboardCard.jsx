import AppIcon from './AppIcon'



export default function DashboardCard({ label, value, icon = 'FileText', hint }) {
  return (
    <div className="glass stat-card">
      <div className="stat-card-icon">
        <AppIcon name={icon} size={20} />
      </div>
      <div className="stat-card-body">
        <span className="stat-card-value">{value ?? '—'}</span>
        <span className="stat-card-label">{label}</span>
        {hint && <span className="stat-card-hint">{hint}</span>}
      </div>
    </div>
  )
}