

















const {
  onDocumentCreated,
  onDocumentUpdated,
} = require('firebase-functions/v2/firestore')
const { db, FieldValue } = require('../config/firebase')

const eventsRef = () => db.collection('events')

exports.onTicketStatusChanged = onDocumentUpdated(
  'tickets/{ticketId}',
  async (event) => {
    const before = event.data.before.data()
    const after = event.data.after.data()

    if ((before.status || '') === (after.status || '')) return null

    const payload = {
      type: 'ticket.status_changed',
      ticketId: event.params.ticketId,
      from: before.status,
      to: after.status,
      customerId: after.customerId || null,
      assignedAgentId: after.assignedAgentId || null,
      createdAt: FieldValue.serverTimestamp(),
    }

    await eventsRef().add(payload)
    return payload
  }
)

exports.onMessageCreated = onDocumentCreated(
  'tickets/{ticketId}/messages/{messageId}',
  async (event) => {
    const data = event.data.data() || {}

    const payload = {
      type: 'ticket.message_created',
      ticketId: event.params.ticketId,
      messageId: event.params.messageId,
      senderId: data.senderId || null,
      message: String(data.message || '').slice(0, 200),
      createdAt: FieldValue.serverTimestamp(),
    }

    await eventsRef().add(payload)
    return payload
  }
)

