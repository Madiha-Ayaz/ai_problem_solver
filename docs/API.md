# SupportFlow — REST API Reference

Base URL (local functions emulator):

```
http://localhost:5001/<PROJECT_ID>/us-central1/api
```

All endpoints require a Firebase ID token — `Authorization: Bearer <ID token>` —
except where noted. Errors are returned as:

```json
{ "error": "<human message>", "code": "<STABLE_ERROR_CODE>" }
```

---

## Health

| Method | Path           | Auth | Description            |
|--------|----------------|------|------------------------|
| GET    | `/api/health`  | no   | Service liveness probe |

---

## Auth

| Method | Path             | Auth | Description                                     |
|--------|------------------|------|-------------------------------------------------|
| POST   | `/api/auth/register` | no | Create account + mint `customer` role           |
| POST   | `/api/auth/login`    | no | Exchange email/password for tokens (identitytoolkit) |
| GET    | `/api/auth/me`      | yes | Current user profile + role                     |
| POST   | `/api/auth/logout`  | yes | Revoke refresh tokens                           |
| POST   | `/api/auth/sync`    | yes | Set role server-side (closed set: customer/agent/admin) |

`POST /api/auth/sync` body: `{ "role": "agent" }` → mints custom claim + profile.

---

## Customer tickets

Mount: `/api/tickets`

| Method | Path            | Auth | Description                          |
|--------|-----------------|------|--------------------------------------|
| POST   | `/api/tickets`  | yes  | Create ticket → AI triage runs       |
| GET    | `/api/tickets`  | yes  | My tickets (ownership-scoped)        |
| GET    | `/api/tickets/:id` | yes | My single ticket (ownership guard)   |

`POST /api/tickets` body:
```json
{
  "subject": "Charged twice for my order",
  "description": "I was charged twice for the same order and need one payment refunded.",
  "category": ""            // optional; AI fills the gap
}
```
Response `201`:
```json
{
  "ticketId": "abc123",
  "ticketNumber": "SFL-000001",
  "suggestion": { "category": "Billing", "priority": "HIGH", "summary": "Possible duplicate payment reported by customer." }
}
```
`suggestion` is `null` when the provider is down (manual triage path).

---

## Messages (thread)

Mount: `/api/tickets`

| Method | Path                         | Auth | Description                     |
|--------|------------------------------|------|---------------------------------|
| GET    | `/api/tickets/:id/messages`  | yes  | Full thread (participants only) |
| POST   | `/api/tickets/:id/messages`  | yes  | Append message + AI auto-reply  |

`POST` body: `{ "message": "hello..." }` → `201` with the saved message.
Rejects with `409 TICKET_RESOLVED` when the ticket is resolved (must reopen).
AI replies appear as sender `ai` / "SupportFlow AI".

---

## Agent tickets

Mount: `/api/agent/tickets`

| Method | Path                     | Auth | Description                              |
|--------|--------------------------|------|------------------------------------------|
| GET    | `/api/agent/tickets`     | yes  | My tickets; `?scope=pool` = NEW queue; `?status=` filter |
| GET    | `/api/agent/tickets/:id` | yes  | View any ticket (queue browsing)          |
| PATCH  | `/api/agent/tickets/:id` | yes  | Update own/claimable ticket               |
| POST   | `/api/agent/tickets/:id/resolve` | yes | Resolve with required note         |
| POST   | `/api/agent/tickets/:id/reopen`  | yes | Reopen a resolved ticket (locks off) |

`PATCH` body (all optional; saving category/priority/summary marks `aiReviewed`):
```json
{ "status": "IN_PROGRESS", "category": "Billing", "priority": "HIGH", "summary": "Possible duplicate payment." }
```
`POST resolve` body: `{ "resolutionNote": "Refund initiated via ticket 45123." }`.

Constraints enforced server-side: transition legality, closure sets,
self-assignment only, and the resolved-ticket lock.

---

## Admin

Mount: `/api/admin` — every route requires an authenticated `admin` role.

| Method | Path                          | Description                                          |
|--------|-------------------------------|------------------------------------------------------|
| GET    | `/api/admin/stats`            | Platform counts (users by role, tickets by status)   |
| GET    | `/api/admin/users`            | `?role=customer|agent` list                          |
| GET    | `/api/admin/users/:uid`       | Single profile                                       |
| GET    | `/api/admin/users/:uid/tickets`| Every ticket a user owns or is assigned              |
| GET    | `/api/admin/tickets`          | Every ticket `?status=`, `?limit=` (1–200)           |
| GET    | `/api/admin/tickets/:id`      | Single ticket (AI suggestion included)               |
| GET    | `/api/admin/tickets/:id/similar` | Duplicate/similar open tickets (bonus)           |
| PATCH  | `/api/admin/users/:uid`       | Change role / active status (never self, never last admin) |
| POST   | `/api/admin/bootstrap`        | First-admin only — body `{ "key": "<ADMIN_BOOTSTRAP_KEY>" }` |
| GET    | `/api/admin/neon`              | Neon (PostgreSQL) mirror — connection status, counts, recent rows of users/tickets/messages |
| POST   | `/api/admin/neon/sync`         | Backfill all Firestore users, tickets and messages into Neon — returns `{ users, tickets, messages }` |

`GET /api/admin/stats` response:
```json
{
  "stats": {
    "totalUsers": 4, "customers": 1, "agents": 1, "admins": 2,
    "totalTickets": 1, "newTickets": 1, "assignedTickets": 0,
    "inProgressTickets": 0, "resolvedTickets": 0, "computedAt": "…"
  }
}
```

---

## Dashboards

Mount: `/api/dashboard`

| Method | Path                   | Auth | Description                  |
|--------|------------------------|------|------------------------------|
| GET    | `/api/dashboard/customer` | customer | My stats + recent tickets |
| GET    | `/api/dashboard/agent`    | agent    | My stats + recent tickets |

---

## AI

Mount: `/api/ai`

| Method | Path           | Auth | Description                             |
|--------|----------------|------|-----------------------------------------|
| POST   | `/api/ai/triage` | yes | Raw triage (no persistence) — `{subject, description}` → `{suggestion}` |

---

## Ticket domain values

```text
Statuses:     NEW → ASSIGNED → IN_PROGRESS → RESOLVED  (reopen: RESOLVED → IN_PROGRESS/NEW)
Priorities:   LOW | MEDIUM | HIGH
Categories:   Account, Billing, Technical, Feature Request, Bug, Other
Roles:        customer | agent | admin
Ticket number: SFL-<6-digit seq>  (server-minted, atomic)
```