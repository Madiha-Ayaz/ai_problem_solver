import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { roleHome } from '../../config/app'
import LoadingState from '../ui/LoadingState'






export default function ProtectedRoute({ children, roles }) {
  const { user, role, loading } = useAuth()
  const location = useLocation()

  if (loading || (user && roles && !role)) {
    return (
      <div className="shell-content">
        <div className="container">
          <LoadingState label="Checking session…" />
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (roles && !roles.includes(role)) {
    return <Navigate to={roleHome(role)} replace />
  }

  return children
}