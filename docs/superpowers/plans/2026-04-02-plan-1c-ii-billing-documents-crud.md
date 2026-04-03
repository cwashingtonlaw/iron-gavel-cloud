# Plan 1C-ii: Billing + Documents CRUD

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add CRUD endpoints for Time Entries, Expenses, Invoices, Transactions (billing/trust), and Documents (metadata only — file upload is Plan 1D), plus a trust balance endpoint.

**Architecture:** Each resource gets its own router following the established pattern from Plan 1C-i: authenticate + authorize middleware, Zod validation, auditLog on mutations. Billing resources are matter-scoped (filter by `?matterId=`). The trust balance endpoint aggregates Transaction data for IOLTA compliance.

**Tech Stack:** Express routers, Prisma, Zod, vitest + supertest (all existing)

**Database connectivity note:** Integration tests MUST run inside Docker:
```bash
export PATH="/Applications/Docker.app/Contents/Resources/bin:$PATH"
cd /tmp/iron-gavel-deploy
docker run --rm --network iron-gavel-deploy_default \
  -v "$(pwd):/app" -w /app/server \
  -e DATABASE_URL="postgresql://irongavel:irongavel@db:5432/irongavel?schema=public" \
  node:20-alpine sh -c "npx vitest run <test-file>"
```

---

## File Structure

```
server/src/routes/
├── timeEntries.router.ts
├── timeEntries.test.ts
├── expenses.router.ts
├── expenses.test.ts
├── invoices.router.ts
├── invoices.test.ts
├── transactions.router.ts
├── transactions.test.ts
├── documents.router.ts
├── documents.test.ts
└── index.ts                 — (modify) Mount all new routers
```

---

### Task 1: Time Entries CRUD

**Files:**
- Create: `server/src/routes/timeEntries.router.ts`
- Create: `server/src/routes/timeEntries.test.ts`
- Modify: `server/src/routes/index.ts`

**Router:** `timeEntries.router.ts`

Zod create schema:
- matterId: string (required)
- userId: string (required)
- date: string (required)
- description: string (required)
- duration: number (required, hours)
- rate: number (required)
- isBilled: boolean (default false)

Update schema: all partial.

GET supports `?matterId=` filter. Standard CRUD pattern.

**Tests (5):**
1. POST creates a time entry
2. GET ?matterId= lists time entries
3. GET /:id gets single time entry
4. PUT updates (mark as billed)
5. DELETE deletes

Commit: `feat: add time entries CRUD`

---

### Task 2: Expenses CRUD

**Files:**
- Create: `server/src/routes/expenses.router.ts`
- Create: `server/src/routes/expenses.test.ts`
- Modify: `server/src/routes/index.ts`

Zod create schema:
- matterId: string (required)
- date: string (required)
- description: string (required)
- amount: number (required)
- type: enum 'HardCost' | 'SoftCost' (required)
- isBilled: boolean (default false)

**Tests (5):**
1. POST creates an expense
2. GET ?matterId= lists expenses
3. GET /:id gets single expense
4. PUT updates (mark as billed)
5. DELETE deletes

Commit: `feat: add expenses CRUD`

---

### Task 3: Invoices CRUD

**Files:**
- Create: `server/src/routes/invoices.router.ts`
- Create: `server/src/routes/invoices.test.ts`
- Modify: `server/src/routes/index.ts`

Zod create schema:
- matterId: string (required)
- issueDate: string (required)
- dueDate: string (required)
- amount: number (required)
- status: enum 'Paid' | 'Unpaid' | 'Overdue' (default 'Unpaid')
- balance: number (optional)
- clientName: string (optional)

**Tests (5):**
1. POST creates an invoice
2. GET ?matterId= lists invoices
3. GET /:id gets single invoice
4. PUT updates (mark as Paid)
5. DELETE deletes

Commit: `feat: add invoices CRUD`

---

### Task 4: Transactions CRUD + Trust Balance

**Files:**
- Create: `server/src/routes/transactions.router.ts`
- Create: `server/src/routes/transactions.test.ts`
- Modify: `server/src/routes/index.ts`

Zod create schema:
- matterId: string (required)
- date: string (required)
- type: enum 'Deposit' | 'Payment' | 'Transfer' (required)
- ledger: enum 'Operating' | 'Trust' (required)
- description: string (required)
- amount: number (required, always positive)
- fromAccount: string (optional)
- toAccount: string (optional)

Extra endpoint: `GET /api/v1/trust/:matterId/balance` — returns trust balance by summing deposits and subtracting payments for a matter's Trust ledger transactions.

**Tests (6):**
1. POST creates a transaction
2. GET ?matterId= lists transactions
3. GET /:id gets single transaction
4. PUT updates a transaction
5. DELETE deletes a transaction
6. GET /trust/:matterId/balance returns correct balance

Commit: `feat: add transactions CRUD and trust balance endpoint`

---

### Task 5: Documents CRUD (metadata only)

**Files:**
- Create: `server/src/routes/documents.router.ts`
- Create: `server/src/routes/documents.test.ts`
- Modify: `server/src/routes/index.ts`

Zod create schema:
- matterId: string (required)
- name: string (required)
- category: string (required)
- size: string (default '0')
- folder: string (optional)
- batesNumber: string (optional)
- isPrivileged: boolean (default false)
- privilegeReason: string (optional)
- discoveryStatus: string (optional)
- sharedWithClient: boolean (default false)

Note: No file upload in this task — that's Plan 1D. This is metadata-only CRUD.

**Tests (5):**
1. POST creates a document record
2. GET ?matterId= lists documents
3. GET /:id gets single document
4. PUT updates (set batesNumber)
5. DELETE deletes

Commit: `feat: add documents metadata CRUD`

---

### Task 6: Full validation — all tests

Run all server tests. Expected total: ~84 tests (58 from 1C-i + 26 new).

Commit any fixes if needed.
