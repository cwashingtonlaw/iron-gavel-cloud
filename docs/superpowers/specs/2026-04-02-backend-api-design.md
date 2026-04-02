# Iron Gavel Backend API — Design Spec

**Date:** 2026-04-02
**Stack:** Node.js, Express, Prisma ORM, PostgreSQL, Passport.js, Socket.io
**Deployment:** Docker on Ugreen NAS (self-hosted)

---

## Architecture

Monolithic Express API running in Docker alongside PostgreSQL on the Ugreen NAS. Three containers orchestrated via Docker Compose:

- **Frontend** — nginx serving the Vite build on port 3000
- **Backend** — Node.js Express API on port 4000
- **PostgreSQL** — database on port 5432 with persistent Docker volume

File storage uses a NAS directory mounted as a Docker volume at `/data/iron-gavel/files`.

```
┌─────────────────────────────────────────────┐
│  Ugreen NAS (Docker Compose)                │
│                                             │
│  ┌──────────┐  ┌──────────┐  ┌───────────┐ │
│  │ Frontend  │  │ Backend  │  │ PostgreSQL│ │
│  │ (nginx)   │→ │ (Express)│→ │           │ │
│  │ :3000     │  │ :4000    │  │ :5432     │ │
│  └──────────┘  └──────────┘  └───────────┘ │
│                     │                       │
│                     ▼                       │
│              ┌────────────┐                 │
│              │ NAS Volume │                 │
│              │ /files     │                 │
│              └────────────┘                 │
└─────────────────────────────────────────────┘
```

---

## Database Schema

~20 tables organized by domain. Prisma ORM manages schema and migrations.

### Users & Auth

- **User** — id, email, passwordHash, name, role (Admin/Attorney/Paralegal/Client), defaultRate, avatarUrl
- **Session** — id, userId, deviceName, ipAddress, expiresAt
- **TwoFactorAuth** — userId, method, secret, enabled

### Matters & Contacts

- **Matter** — id, name, status, openDate, practiceArea, billingType, rate, permissions, responsibleAttorneyId
- **Contact** — id, name, email, phone, type (Client/Witness/Counsel), isCompany, prefix, firstName, lastName
- **MatterContact** — join table linking matters to contacts with role
- **RelatedParty** — matterId, name, relationship (for conflict detection)

### Billing & Trust

- **TimeEntry** — id, matterId, userId, date, description, duration, rate, isBilled
- **Expense** — id, matterId, date, description, amount, type (Hard/Soft Cost), isBilled
- **Invoice** — id, matterId, issueDate, dueDate, amount, status, balance
- **Transaction** — id, matterId, date, type (Deposit/Payment/Transfer), ledger (Operating/Trust), amount

### Documents & Files

- **Document** — id, matterId, name, category, filePath, size, folder, batesNumber, isPrivileged
- **DocumentVersion** — id, documentId, version, filePath, uploadedAt, uploadedById

### Calendar & Tasks

- **Event** — id, title, date, startTime, endTime, matterId, type, location, recurrence
- **Task** — id, matterId, assignedUserId, description, dueDate, priority, completed

### Communication

- **Communication** — id, matterId, type (Email/Call/Meeting), subject, date, summary, participants

### Audit & Compliance

- **AuditLog** — id, timestamp, userId, action, entityType, entityId, changes (JSON), hash, previousHash
- **ConflictSearch** — id, timestamp, userId, query, resultsSummary, riskScore

### Client Portal

- **PortalMessage** — id, matterId, senderId, content, readAt
- **SharedDocument** — id, documentId, contactId, sharedAt, accessedAt

---

## API Layer

RESTful API, all prefixed with `/api/v1`. Request validation via Zod schemas shared with frontend.

### Auth

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/auth/register` | Create account |
| POST | `/auth/login` | Returns JWT access + refresh tokens |
| POST | `/auth/refresh` | Refresh expired access token |
| POST | `/auth/logout` | Invalidate session |
| POST | `/auth/2fa/setup` | Enable 2FA |
| POST | `/auth/2fa/verify` | Verify 2FA code |

### CRUD Resources

Standard REST pattern for each resource:

`GET /` | `POST /` | `GET /:id` | `PUT /:id` | `DELETE /:id`

Applies to: `/matters`, `/contacts`, `/tasks`, `/events`, `/invoices`, `/expenses`, `/time-entries`, `/transactions`, `/communications`, `/documents`, `/workflows`

### Billing-Specific

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/invoices/generate` | Auto-generate from unbilled time/expenses |
| GET | `/trust/:matterId/balance` | Trust account balance |
| POST | `/trust/reconcile` | 3-way IOLTA reconciliation |

### Documents

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/documents/upload` | Multipart file upload to NAS volume |
| GET | `/documents/:id/download` | Stream file from NAS |
| POST | `/documents/:id/bates` | Assign Bates numbers |

### Client Portal

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/portal/matters` | Client sees only their matters |
| GET | `/portal/documents` | Shared documents only |
| GET | `/portal/messages` | Portal messages |
| POST | `/portal/messages` | Send portal message |

### Search & Conflicts

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/search?q=` | Full-text search across entities |
| POST | `/conflicts/check` | Run conflict detection |

### AI (Phase 3)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/ai/chat` | General AI chat |
| POST | `/ai/summarize` | Case/document summarization |
| POST | `/ai/draft` | Document/email drafting |

### Middleware Stack

Applied in order on every request:

1. Rate limiting
2. JWT verification
3. Role-based authorization (Admin > Attorney > Paralegal > Client)
4. Matter-level permission check
5. Audit logging (automatic on all mutations)
6. Request validation (Zod)

---

## Authentication & Authorization

### JWT with Refresh Tokens

- Access token: 15 min expiry, stored in memory on frontend
- Refresh token: 7 day expiry, stored in httpOnly cookie
- On access token expiry, frontend silently refreshes via `/auth/refresh`

### Password Handling

- bcrypt hashing (12 salt rounds)
- Minimum 8 characters, enforced server-side via Zod

### Role-Based Access

| Role | Access |
|------|--------|
| Admin | Full access to everything |
| Attorney | Full access to assigned matters, read-only on firm settings |
| Paralegal | Read/write on assigned matters, no billing admin |
| Client | Portal only, sees own matters and shared documents |

### Matter-Level Permissions

Preserving the existing frontend model:

- **Firm** — all staff can see
- **Private** — only responsible attorney
- **Selective** — only users in allowedUserIds

Enforced by middleware that checks matter permissions before returning data.

### 2FA

- Optional for staff, setup via authenticator app or email
- On login with 2FA enabled: returns temporary token → frontend prompts for code → `POST /auth/2fa/verify` returns real JWT

### Client Portal Auth

- Clients invited via email with one-time link
- Set password on first visit
- Same JWT system, role is Client, middleware restricts to portal endpoints

---

## File Storage

### NAS Volume Layout

```
/data/iron-gavel/
├── files/
│   ├── matters/
│   │   └── {matterId}/
│   │       ├── {documentId}_v1.pdf
│   │       └── {documentId}_v2.pdf
│   └── avatars/
│       └── {userId}.jpg
└── backups/
    └── pg_dump_2026-04-02.sql
```

### Upload Flow

1. Frontend sends `POST /api/v1/documents/upload` with multipart form data
2. Backend validates file type and size (configurable max, default 100MB)
3. File written to `/data/iron-gavel/files/matters/{matterId}/`
4. `Document` row created in Postgres with filePath
5. `DocumentVersion` row created (version 1)
6. Audit log entry recorded

### Versioning

- Re-uploading creates a new DocumentVersion
- Previous versions remain on disk, accessible via `/documents/:id/versions`

### Downloads

- `GET /documents/:id/download` streams file with proper Content-Type
- Permission middleware checks matter access
- Portal users can only download documents in SharedDocument table

### Allowed File Types

PDF, DOCX, DOC, XLSX, CSV, PNG, JPG, TIFF, MP3, MP4, WAV

---

## Real-Time & Notifications

### WebSocket via Socket.io

- Single connection per authenticated user
- JWT verified on connection handshake
- Three use cases:
  1. Portal messaging — instant delivery without polling
  2. Live notifications — task assignments, document shares, deadline reminders
  3. Collaboration updates — notify when another user edits a matter you're viewing

### Client Portal

Same frontend app with restricted view:

- Client role → frontend routes to portal-only pages
- Backend enforces via portal-scoped endpoints
- No separate deployment

### Notification Types

| Event | Recipients | Channel |
|-------|-----------|---------|
| New portal message | Recipient (attorney or client) | WebSocket + email |
| Document shared | Client | WebSocket + email |
| Task assigned | Assigned user | WebSocket |
| Deadline approaching (7d, 3d, 1d) | Responsible attorney | WebSocket + email |
| Invoice generated | Client (if portal access) | Email |

### Email

- Nodemailer with configurable SMTP
- HTML templates stored server-side
- Configured via environment variables

---

## Phased Delivery

### Phase 1 — Core Data + Auth

- Docker setup: Express + PostgreSQL containers added to existing compose
- Prisma schema, migrations, seed data
- JWT auth with refresh tokens, bcrypt passwords, role middleware
- CRUD endpoints for: Users, Matters, Contacts, Tasks, Events, Documents (with file upload), Communications
- Billing endpoints: TimeEntries, Expenses, Invoices, Transactions, trust balance
- Audit logging middleware (automatic hash-chained logging on all mutations)
- Frontend refactor: replace Zustand localStorage persistence with API calls
- Shared types package (`packages/shared/`) — Zod schemas and TypeScript types used by both frontend and backend, extracted from existing `types.ts`

### Phase 2 — Client Portal

- Client invitation flow (email link → set password)
- Portal-scoped endpoints (matters, documents, messages)
- Socket.io for real-time portal messaging
- Email notifications via Nodemailer
- Shared document access tracking

### Phase 3 — AI Proxy

- Server-side Gemini API key (removed from frontend)
- `/ai/*` endpoints proxying all 20+ Gemini functions
- Response caching for repeated queries
- Rate limiting per user

### Phase 4 — Advanced Features

- 2FA setup and verification
- Conflict detection graph operations
- Workflow execution engine
- Full-text search (PostgreSQL tsvector)
- Deadline calculation with court rules
- Database backups (automated pg_dump to NAS volume)
