import { NavLink } from 'react-router-dom'
import { LifeBuoy, ChevronLeft } from 'lucide-react'
import { appName, customerNav, agentNav, adminNav } from '../../config/app'
import { ROLES } from '../../config/tickets'
import { useAuth } from '../../context/AuthContext'
import { cx } from '../../lib/utils'
import AppIcon from '../ui/AppIcon'




const GROUPS_BY_ROLE = {
  [ROLES.CUSTOMER]: [{ role: ROLES.CUSTOMER, label: 'Customer', items: customerNav }],
  [ROLES.AGENT]: [{ role: ROLES.AGENT, label: 'Agent', items: agentNav }],
  [ROLES.ADMIN]: [{ role: ROLES.ADMIN, label: 'Admin', items: adminNav }],
}


export default function Sidebar({ collapsed, onToggle, onNavigate }) {
  const { role } = useAuth()
  const groups = GROUPS_BY_ROLE[role] || GROUPS_BY_ROLE[ROLES.CUSTOMER]

  return (
    <aside className={cx('sidebar glass', collapsed && 'sidebar-collapsed')}>
      <div className="sidebar-head">
        <NavLink to="/" className="sidebar-brand">
          <LifeBuoy size={22} className="sidebar-logo" />
          {!collapsed && <span className="neon-text">{appName}</span>}
        </NavLink>
        <button
          type="button"
          className="btn-icon sidebar-toggle"
          onClick={onToggle}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <ChevronLeft size={18} />
        </button>
      </div>

      <nav className="sidebar-nav">
        {groups.map((group) => (
          <div key={group.role} className="sidebar-group">
            {!collapsed && <span className="sidebar-group-label">{group.label}</span>}
            {group.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={onNavigate}
                className={({ isActive }) =>
                  cx('sidebar-link', isActive && 'active')
                }
              >
                <AppIcon name={item.icon} size={18} />
                {!collapsed && <span className="sidebar-link-label">{item.label}</span>}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {!collapsed && <div className="sidebar-foot">SMIT AI Factory 2.0</div>}
    </aside>
  )
}