


















const { db, FieldValue } = require('../config/firebase')
const neonMirror = require('./neon/mirror')

const messagesRef = (ticketId) => db.collection('tickets').doc(ticketId).collection('messages')

async function createMessage({ ticketId, senderId, message, senderRole = null, authorName = null }) {
  const ref = messagesRef(ticketId).doc()
  const data = {
    id: ref.id,
    ticketId,
    senderId,
    senderRole,
    authorName,
    message,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  }
  await ref.set(data)
  await neonMirror.upsertMessage({ id: ref.id, ticketId, senderId, senderRole, authorName, message })
  return { ...data, id: ref.id }
}

async function listMessages(ticketId, { limit = 200 } = {}) {
  const snap = await messagesRef(ticketId)
    .orderBy('createdAt', 'asc')
    .limit(Math.min(limit, 500))
    .get()
  return snap.docs
    .filter((d) => d.exists)
    .map((d) => {
      const data = d.data()
      if (data.createdAt && typeof data.createdAt.toDate === 'function') {
        data.createdAt = data.createdAt.toDate().toISOString()
      }
      return { id: d.id, ...data }
    })
}

module.exports = { createMessage, listMessages }

