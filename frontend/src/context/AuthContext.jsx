import { createContext, useContext, useEffect, useRef, useState } from 'react'
import {
  onAuthStateChanged,
  onIdTokenChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as fbSignOut,
  updateProfile,
} from 'firebase/auth'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db, googleProvider } from '../lib/firebase'
import { api } from '../lib/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [role, setRole] = useState(null)
  const [loading, setLoading] = useState(true)

  
  
  
  
  const pendingRoleRef = useRef(null)

  
  
  
  const resolveRole = async (fbUser, requestedRole = pendingRoleRef.current) => {
    if (!fbUser) {
      pendingRoleRef.current = null
      setRole(null)
      return null
    }
    try {
      const result = await api.syncRole(requestedRole)
      const r = (result && result.role) || 'customer'
      
      
      try {
        await auth.currentUser?.getIdToken(true)
      } catch {
        
      }
      pendingRoleRef.current = null
      setRole(r)
      return r
    } catch {
      try {
        const me = await api.me()
        const r = (me.user && me.user.role) || 'customer'
        pendingRoleRef.current = null
        setRole(r)
        return r
      } catch {
        pendingRoleRef.current = null
        setRole('customer')
        return 'customer'
      }
    }
  }

  
  
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (fbUser) => {
      setUser(fbUser)
      if (fbUser) {
        resolveRole(fbUser, pendingRoleRef.current)
      } else {
        pendingRoleRef.current = null
        setRole(null)
      }
      setLoading(false)
    })
    const unsubToken = onIdTokenChanged(auth, (fbUser) => {
      if (fbUser?.uid) {
        resolveRole(fbUser, pendingRoleRef.current)
        setUser(fbUser)
      }
    })
    return () => {
      unsubAuth()
      unsubToken()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  
  
  
  const saveUser = async (fbUser, extra = {}) => {
    try {
      const data = {
        uid: fbUser.uid,
        name: fbUser.displayName || '',
        email: fbUser.email || '',
        avatar: fbUser.photoURL || '',
        provider: extra.provider || 'email',
        createdAt: serverTimestamp(),
      }
      if (extra.role) data.role = extra.role
      await setDoc(doc(db, 'users', fbUser.uid), data, { merge: true })
    } catch (e) {
      console.warn('[Auth] Firestore profile sync skipped (best-effort):', e.code || e.message)
    }
  }

  const signIn = async (email, password, role) => {
    pendingRoleRef.current = role || null
    const cred = await signInWithEmailAndPassword(auth, email, password)
    await saveUser(cred.user)
    return resolveRole(cred.user, pendingRoleRef.current)
  }

  const signUp = async (name, email, password, role) => {
    pendingRoleRef.current = role || null
    const cred = await createUserWithEmailAndPassword(auth, email, password)
    if (name) {
      await updateProfile(cred.user, { displayName: name })
    }
    await saveUser(cred.user, { role })
    return resolveRole(cred.user, role)
  }

  const signInWithGoogle = async (role) => {
    pendingRoleRef.current = role || null
    const cred = await signInWithPopup(auth, googleProvider)
    await saveUser(cred.user, { provider: 'google' })
    return resolveRole(cred.user, pendingRoleRef.current)
  }

  const signOut = async () => {
    await fbSignOut(auth)
    setUser(null)
    setRole(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        loading,
        isAuthenticated: !!user,
        signIn,
        signUp,
        signInWithGoogle,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}


export function useAuth() {
  return useContext(AuthContext)
}