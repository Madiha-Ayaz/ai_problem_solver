import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { TextField } from '../../components/forms/FormField'
import { initials } from '../../lib/utils'


export default function Profile() {
  const { user } = useAuth()
  const { showToast } = useToast()
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    try {
      showToast('Profile sync is wired up in the next milestone.', 'info')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <div className="page-head">
        <h1>My Profile</h1>
        <p className="muted">Your agent account details and preferences.</p>
      </div>

      <div className="glass panel">
        <div className="profile-card">
          {user?.photoURL ? (
            <img src={user.photoURL} alt={user.displayName || 'User'} className="avatar avatar-lg" />
          ) : (
            <div className="avatar avatar-lg avatar-fallback">
              {initials(user?.displayName || user?.email)}
            </div>
          )}
          <div>
            <h2 className="h3">{user?.displayName || 'Unnamed agent'}</h2>
            <p className="muted">{user?.email}</p>
          </div>
        </div>

        <form className="profile-form" onSubmit={submit}>
          <TextField
            label="Display name"
            name="displayName"
            defaultValue={user?.displayName || ''}
            placeholder="Your name"
          />
          <TextField
            label="Email"
            name="email"
            defaultValue={user?.email || ''}
            disabled
            hint="Email is linked to your sign-in method and cannot be changed here."
          />
          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={busy}>
              {busy ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </>
  )
}