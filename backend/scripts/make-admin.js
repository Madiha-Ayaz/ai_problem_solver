










require('../config/env') 

const API_BASE = 'http://localhost:5001/fullstackdev-29215/us-central1/api'

async function main() {
  const token = process.argv[2]
  if (!token) {
    console.error('Usage: node scripts/make-admin.js "<Firebase ID token>"')
    process.exit(1)
  }
  const key = process.env.ADMIN_BOOTSTRAP_KEY
  if (!key) {
    console.error('ADMIN_BOOTSTRAP_KEY is not set in backend/.env — bootstrap is disabled.')
    process.exit(1)
  }

  const res = await fetch(`${API_BASE}/api/admin/bootstrap`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ key }),
  })
  const data = await res.json().catch(() => null)
  if (res.ok) {
    console.log('Admin created:', JSON.stringify(data.user))
  } else {
    console.error(`Bootstrap failed (${res.status}):`, (data && data.error) || 'unknown error')
    process.exit(1)
  }
}

main().catch((e) => {
  console.error('Error:', e.message)
  process.exit(1)
})