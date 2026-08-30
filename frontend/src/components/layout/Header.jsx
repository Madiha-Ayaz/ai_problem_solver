import { useLocation, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Menu, LogOut, User } from 'lucide-react'
import { initials } from '../../lib/utils'


const TITLES = {
  '/customer': 'Customer Dashboard',
  '/customer/tickets': 'My Tickets',
  '/customer/tickets/new': 'Create Ticket',
  '/customer/profile': 'My Profile',
  '/agent': 'Agent Dashboard',
  '/agent/tickets': 'Agent Tickets',
  '/agent/profile': 'My Profile',
  '/admin': 'Admin Dashboard',
  '/admin/customers': 'Customers',
  '/admin/agents': 'Agents',
  '/admin/customer/tickets': 'User Tickets',
  '/admin/resolve/suggestions': 'Resolve Suggestions',
  '/admin/tickets': 'All Tickets',
  '/admin/neon': 'Neon Database',
}


export default function Header({ onOpenSidebar }) {
  const { pathname } = useLocation()
  const { user, signOut } = useAuth()

  const title =
    TITLES[pathname] ||
    (pathname.startsWith('/admin/tickets/')
      ? 'Ticket Details'
      : pathname.startsWith('/admin/customers/')
        ? 'Customer Details'
        : pathname.startsWith('/admin/agents/')
          ? 'Agent Details'
          : 'SupportFlow')

  return (
    <header className="app-header glass">
      <button
        type="button"
        className="btn-icon header-burger"
        onClick={onOpenSidebar}
        aria-label="Open sidebar"
      >
        <Menu size={20} />
      </button>

      <span className="app-header-title">{title}</span>

      <div className="app-header-user">
        {user ? (
          <>
            <div className="avatar-wrap">
              {user.photoURL ? (
                <img src={user.photoURL} alt={user.displayName || 'User'} className="avatar" />
              ) : (
                <div className="avatar avatar-fallback">
                  {initials(user.displayName || user.email)}
                </div>
              )}
              <span className="header-user-name">
                {user.displayName || user.email}
              </span>
            </div>
            <button
              type="button"
              className="btn-icon"
              onClick={signOut}
              title="Sign out"
              aria-label="Sign out"
            >
              <LogOut size={18} />
            </button>
          </>
        ) : (
          <Link to="/login" className="btn btn-ghost btn-sm" title="Sign in">
            <User size={16} /> Sign in
          </Link>
        )}
      </div>
    </header>
  )
}