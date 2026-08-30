# SupportFlow — AI-Assisted Support Desk

SupportFlow is a full-stack, real-time customer support desk. A customer submits
a ticket → the system auto-triages it (category, priority, summary) → an agent
reviews the suggestion, claims the ticket, and chats with the customer — all in
real time — with a supervisor portal to monitor every customer, agent, ticket,
and AI suggestion on the platform.

## Core workflow

```
Customer submits ticket ──▶ AI triage ──▶ New
                                              │
            Agent reviews AI suggestion, claims ─┤
                                                  ▼
                                          Assigned → In Progress
                                                  │
                           Customer ⇄ AI/agent conversation (real-time)
                                                  │
                                             Resolved (with note)
                                                  │
                                    Reopen (only way to edit again)
```

## Features

Core
- Authentication with protected **customer / agent / admin** areas
- Customer ticket form (subject, description, optional category)
- Unique server-minted ticket number (`SFL-000001`, atomic counter)
- Status workflow `NEW → ASSIGNED → IN_PROGRESS → RESOLVED`
- AI triage suggestion (category + priority + summary) for human review before finalizing
- Agent dashboard: claim tickets, review AI, reply, change status, resolve
- Customer view of own ticket + live status + conversation
- Persisted conversation history (Firestore sub-collection)
- Dashboard statistics from real ticket data (customer / agent / admin)
- Responsive UI with loading, success and error states everywhere

Real-time
- Firestore `onSnapshot` (WebSocket-backed) live updates — ticket status, message
  threads, and lists update without a page refresh

Business rules
- Only authenticated users reach protected areas (server RBAC + Firestore rules)
- Customers read only their own tickets (ownership guard + rules)
- Agents update only tickets assigned to them (or claim an unassigned `NEW` one)
- Resolved tickets are locked until a dedicated **reopen**
- AI output is validated before being stored (falls back to manual triage)
- API keys live only on the server (never in frontend code)
- A ticket cannot be marked Resolved without a resolution note

Bonus
- Similar / duplicate ticket detection (admin supervisor view)
- In-chat AI assistant that answers the customer instantly

## Tech stack

| Layer        | Technology                                                             |
|--------------|------------------------------------------------------------------------|
| Frontend     | React 18 + Vite, React Router, Firebase Web SDK, lucide-react          |
| Backend      | Node.js 20 + Express                                                   |
| Database     | Cloud Firestore (NoSQL) + security rules, mirrored to Neon (PostgreSQL) |
| Auth         | Firebase Authentication (email/password + Google), roles via custom claims |
| Real-time    | Cloud Firestore `onSnapshot` listeners                                 |
| AI           | OpenRouter API (LLM-based triage + chat assistant)                     |
| Hosting      | Firebase App Hosting / EC2 + Nginx (frontend) + pm2 (Node backend)     |

## Repository layout

```
.
├── backend/                 # Express API (Node.js)
│   ├── constants/           # statuses / priorities / categories / roles / flow
│   ├── config/              # firebase, env, neon db — secrets load here
│   ├── middleware/          # auth (JWT), rbac (roles/ownership), validate, errors
│   ├── models/              # Firestore + Neon persistence (user, ticket, message)
│   ├── routes/              # auth, tickets, messages, agent, admin, dashboard
│   ├── services/            # ai, ticket, message, dashboard, admin, auth
│   └── index.js             # Express app
├── frontend/                # React + Vite SPA
│   └── src/                 # config, context, hooks, lib (api/firebase/realtime),
│                            # pages (auth, customer, agent, admin), components, styles
├── scripts/dev.js           # `npm run dev` orchestrator (backend + frontend)
├── firestore.rules          # security rules (role safety)
├── firestore.indexes.json
└── docs/API.md              # REST API reference
```

## Firestore data model

| Collection               | Shape (fields)                                                                       |
|--------------------------|--------------------------------------------------------------------------------------|
| `users/{uid}`            | `name, email, role, provider, isActive, createdAt, updatedAt`                        |
| `tickets/{id}`           | `ticketNumber, subject, description, category, priority, summary, status, customerId, assignedAgentId, aiSuggestion, aiReviewed, resolutionNote, createdAt, updatedAt, resolvedAt` |
| `tickets/{id}/messages/{mid}` | `ticketId, senderId, senderRole, authorName, message, createdAt`                  |
| `counters/tickets`       | `value` — atomic sequence for ticket numbers                                        |
| `events/{id}`            | reserved for in-app notifications                                                    |

Roles come from **verified ID-token custom claims**, then the profile doc —
clients can never mint a role. Ticket writes are server-managed; message appends
are allowed for participants and blocked on `RESOLVED` tickets.

## Setup (local development)

Prerequisites: **Node.js 20**, a Firebase project, and the Firebase CLI only if
you run the emulators.

1. Install:
   ```bash
   npm install
   (cd backend && npm install)
   (cd frontend && npm install)
   ```
2. Create `backend/.env` (see `backend/.env.example`):
   ```
   FIREBASE_WEB_API_KEY=your-project-web-api-key
   ADMIN_BOOTSTRAP_KEY=your-secret-key
   AI_API_KEY=sk-or-v1-...            # OpenRouter key
   AI_BASE_URL=https://openrouter.ai/api/v1
   AI_MODEL=google/gemma-4-31b-it:free
   AI_TIMEOUT_MS=20000
   ```
3. Create `frontend/.env` (see `frontend/.env.example`) with your Firebase web
   app config:
   ```
   VITE_FIREBASE_API_KEY=...
   VITE_FIREBASE_AUTH_DOMAIN=...
   VITE_FIREBASE_PROJECT_ID=...
   VITE_FIREBASE_STORAGE_BUCKET=...
   VITE_FIREBASE_MESSAGING_SENDER_ID=...
   VITE_FIREBASE_APP_ID=...
   VITE_FIREBASE_MEASUREMENT_ID=...
   VITE_API_URL=http://localhost:5001/<PROJECT_ID>/us-central1/api
   VITE_USE_EMULATORS=false
   ```
4. Start everything:
   ```bash
   npm run dev
   ```

## Create the first Admin

Admins are minted server-side. Option A (recommended):
```bash
node scripts/make-admin.js "<your firebase ID token>"
```
Option B: sign up from the app choosing the **Admin** portal — the requested
role is validated server-side against the closed set.

## Demo walkthrough

Create fresh demo accounts per role (the portal selector mints the role):

| Portal   | Role      | How                          |
|----------|-----------|------------------------------|
| Admin    | `admin`   | pick **Admin** at sign-up     |
| Agent    | `agent`   | pick **Agent** at sign-up     |
| Customer | `customer`| pick **Customer** (default)   |

1. **Customer** creates a ticket → AI suggests category/priority/summary.
2. **Agent** sees the `NEW` ticket, reviews the AI suggestion, claims it,
   responds via chat → status goes In Progress (live).
3. **Customer** sees the status change and reply without refreshing (real-time).
4. **Agent** marks it **Resolved** with a resolution note (required).
5. **Admin** sees the ticket, AI path, thread, and similar tickets across all users.
6. **Reopen** is the only way to edit a resolved ticket again.

## API

Full endpoint reference with request/response samples:
**[docs/API.md](docs/API.md)**

Key areas: `/api/auth/*`, `/api/tickets/*` (customer), `/api/agent/tickets/*`,
`/api/admin/*`, `/api/dashboard/*`, `/api/ai/*`. All endpoints require a
`Authorization: Bearer <Firebase ID token>` except auth helpers.

## Deployment

```bash
firebase use <project>
firebase deploy --only firestore:rules,functions,hosting
firebase functions:secrets:set AI_API_KEY
firebase functions:secrets:set FIREBASE_WEB_API_KEY
```
For an EC2/nginx + pm2 deployment, build the frontend (`npm run build`), serve
the `dist` output with nginx, proxy `/api/` to the Node backend (port `8080`)
managed by pm2, and point the nginx document root at the built assets.
