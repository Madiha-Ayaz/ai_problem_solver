import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { roleHome } from '../config/app'
import { ROLES } from '../config/tickets'
import { motion } from 'framer-motion'
import { Mail, Lock, Globe, User, UserCheck, ShieldCheck, Eye, EyeOff, AlertCircle } from 'lucide-react'



const ROLE_OPTIONS = [
  { value: ROLES.CUSTOMER, label: 'Customer', icon: User, hint: 'Raise tickets' },
  { value: ROLES.AGENT, label: 'Agent', icon: UserCheck, hint: 'Resolve tickets' },
  { value: ROLES.ADMIN, label: 'Admin', icon: ShieldCheck, hint: 'Manage all' },
]


export default function AuthPage({ mode }) {
  const isSignup = mode === 'signup'
  const { signIn, signUp, signInWithGoogle } = useAuth()
  const navigate = useNavigate()

  const [role, setRole] = useState(ROLES.CUSTOMER)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState('') 

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setBusy('email')
    try {
      const resolvedRole = isSignup
        ? await signUp(name, email, password, role)
        : await signIn(email, password, role)
      navigate(roleHome(resolvedRole))
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy('')
    }
  }

  const handleGoogle = async () => {
    setError('')
    setBusy('google')
    try {
      const resolvedRole = await signInWithGoogle(role)
      navigate(roleHome(resolvedRole))
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy('')
    }
  }

  return (
    <div className="auth-wrap">
      <motion.div
        className="auth-card glass"
        initial={{ opacity: 0, y: 30, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="auth-title neon-text">
          {isSignup ? 'Create Account' : 'Welcome Back'}
        </h1>
        <p className="auth-sub">
          {isSignup
            ? 'Choose your portal and join the command center'
            : 'Pick a portal, then sign in with your account'}
        </p>

        {/* Portal selector: Admin / Customer / Agent */}
        <div className="role-selector" role="radiogroup" aria-label="Select your portal">
          {ROLE_OPTIONS.map((opt) => {
            const Icon = opt.icon
            const active = role === opt.value
            return (
              <button
                key={opt.value}
                type="button"
                role="radio"
                aria-checked={active}
                className={'role-card' + (active ? ' active' : '')}
                onClick={() => setRole(opt.value)}
              >
                <Icon size={20} />
                <strong>{opt.label}</strong>
                <small>{opt.hint}</small>
              </button>
            )
          })}
        </div>

        {/* Google button */}
        <button
          onClick={handleGoogle}
          disabled={busy === 'google'}
          className="btn btn-google"
        >
          <Globe size={18} />
          {busy === 'google' ? 'Connecting...' : 'Continue with Google'}
        </button>

        <div className="divider"><span>or</span></div>

        {error && (
          <div className="auth-error">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        <form onSubmit={submit}>
          {isSignup && (
            <div className="field">
              <User size={18} />
              <input
                type="text"
                placeholder="Full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          )}

          <div className="field">
            <Mail size={18} />
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="field">
            <Lock size={18} />
            <input
              type={showPw ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className="field-eye"
              onClick={() => setShowPw((v) => !v)}
              aria-label="Toggle password"
            >
              {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <button type="submit" disabled={busy === 'email'} className="btn btn-primary btn-block">
            {busy === 'email' ? 'Processing...' : isSignup ? 'Sign Up' : 'Sign In'}
          </button>
        </form>

        <div className="demo-hint">
          Demo login: <code>demo@saylani.com</code> / <code>demo123</code>
        </div>

        <p className="auth-switch">
          {isSignup ? (
            <>Already have an account? <Link to="/login">Sign in</Link></>
          ) : (
            <>New here? <Link to="/register">Create an account</Link></>
          )}
        </p>
      </motion.div>
    </div>
  )
}