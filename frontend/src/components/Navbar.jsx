import { Link, useNavigate } from 'react-router-dom'
import { LifeBuoy, LogOut, User } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { appName } from '../config/app'
import { initials } from '../lib/utils'


export default function Navbar() {
  const { user, isAuthenticated, signOut } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  return (
    <nav className="nav glass">
      <div className="container nav-inner">
        <Link to="/" className="nav-logo">
          <LifeBuoy size={22} className="logo-ico" />
          <span className="neon-text">{appName}</span>
        </Link>

        <div className="nav-user">
          {isAuthenticated ? (
            <>
              <div className="avatar-wrap">
                {user.photoURL ? (
                  <img src={user.photoURL} alt={user.displayName || 'User'} className="avatar" />
                ) : (
                  <div className="avatar avatar-fallback">
                    {initials(user.displayName || user.email)}
                  </div>
                )}
              </div>
              <Link to="/customer" className="btn btn-ghost btn-sm">
                <User size={15} /> Dashboard
              </Link>
              <button onClick={handleSignOut} className="btn btn-icon" title="Sign out">
                <LogOut size={18} />
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost btn-sm">Sign in</Link>
              <Link to="/register" className="btn btn-primary btn-sm">Sign Up</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}