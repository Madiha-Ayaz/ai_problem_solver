






const { db, FieldValue } = require('../config/firebase')
const neonMirror = require('./neon/mirror')

const usersRef = () => db.collection('users')


async function listUsers({ role, limit = 200 } = {}) {
  let q = usersRef()
  if (role) q = q.where('role', '==', role)
  const snap = await q.limit(Math.min(limit, 500)).get()
  return snap.docs.map((d) => ({ uid: d.id, ...d.data() }))
}


async function countUsers({ role } = {}) {
  const q = role ? usersRef().where('role', '==', role) : usersRef()
  const snap = await q.count().get()
  const data = snap.data()
  return data && data.count != null ? data.count : 0
}

async function getUser(uid) {
  const snap = await usersRef().doc(uid).get()
  return snap.exists ? { id: snap.id, ...snap.data() } : null
}

async function createUser({ uid, name, email, role, provider }) {
  const now = FieldValue.serverTimestamp()
  const data = {
    uid,
    name,
    email,
    role,
    provider: provider || 'email',
    isActive: true,
    createdAt: now,
    updatedAt: now,
  }
await usersRef().doc(uid).set(data)
  await neonMirror.upsertUser({ uid, name, email, role, provider: provider || 'email', isActive: true })
  return { id: uid, ...data }
}

async function updateUser(uid, patch) {
  if (typeof patch !== 'object' || patch === null) return null
  
  
  await usersRef().doc(uid).set({ ...patch, updatedAt: FieldValue.serverTimestamp() }, { merge: true })
  const updated = await getUser(uid)
  if (updated) await neonMirror.upsertUser(updated)
  return updated
}

module.exports = { getUser, createUser, updateUser, listUsers, countUsers }

