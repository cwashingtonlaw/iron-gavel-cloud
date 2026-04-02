# Plan 1A: Project Scaffold + Docker + Database

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the Express + Prisma + PostgreSQL backend in Docker, with the full database schema migrated and seeded with test data, ready for API development in Plan 1B.

**Architecture:** Monolithic Express API in a `server/` directory at the repo root. Prisma ORM manages the PostgreSQL schema. Docker Compose orchestrates three containers (frontend nginx, backend Node.js, PostgreSQL). A shared `packages/shared/` directory holds TypeScript types and Zod schemas used by both frontend and backend.

**Tech Stack:** Node.js 20, Express 4, Prisma 6, PostgreSQL 16, TypeScript 5.8, Zod 4, Docker, Docker Compose

---

### Task 1: Initialize the monorepo structure

**Files:**
- Create: `server/package.json`
- Create: `server/tsconfig.json`
- Create: `packages/shared/package.json`
- Create: `packages/shared/tsconfig.json`
- Modify: `package.json` (root — add workspaces)

- [ ] **Step 1: Add workspaces to root package.json**

Add a `workspaces` field to the existing root `package.json`:

```json
{
  "name": "iron-gavel-cloud",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "workspaces": [
    "packages/*",
    "server"
  ],
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest"
  }
}
```

Note: Keep all existing dependencies and devDependencies unchanged. Only add `workspaces` and update `name`.

- [ ] **Step 2: Create shared types package**

Create `packages/shared/package.json`:

```json
{
  "name": "@iron-gavel/shared",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch"
  },
  "dependencies": {
    "zod": "^4.1.12"
  },
  "devDependencies": {
    "typescript": "~5.8.2"
  }
}
```

Create `packages/shared/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "declaration": true,
    "declarationMap": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "skipLibCheck": true,
    "esModuleInterop": true
  },
  "include": ["src"]
}
```

Create `packages/shared/src/index.ts`:

```typescript
export * from './types.js';
```

Create `packages/shared/src/types.ts` — start with an empty placeholder:

```typescript
// Shared types will be extracted from the frontend types.ts in a later task.
// For now, export the enums and interfaces needed by the Prisma seed.

export type UserRole = 'Admin' | 'Attorney' | 'Paralegal' | 'Client';
```

- [ ] **Step 3: Create server package**

Create `server/package.json`:

```json
{
  "name": "@iron-gavel/server",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "test": "vitest",
    "db:generate": "prisma generate",
    "db:migrate": "prisma migrate dev",
    "db:push": "prisma db push",
    "db:seed": "tsx prisma/seed.ts"
  },
  "dependencies": {
    "@iron-gavel/shared": "workspace:*",
    "@prisma/client": "^6.6.0",
    "express": "^4.21.0",
    "zod": "^4.1.12"
  },
  "devDependencies": {
    "@types/express": "^5.0.0",
    "@types/node": "^22.14.0",
    "prisma": "^6.6.0",
    "tsx": "^4.19.0",
    "typescript": "~5.8.2",
    "vitest": "^4.0.13"
  },
  "prisma": {
    "seed": "tsx prisma/seed.ts"
  }
}
```

Create `server/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "declaration": true
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 4: Install dependencies**

Run from the repo root:

```bash
npm install
```

This installs all workspace dependencies including the server's Prisma and Express packages.

- [ ] **Step 5: Verify the workspace structure**

Run:

```bash
npm ls --workspaces
```

Expected: Shows `@iron-gavel/shared` and `@iron-gavel/server` as workspace packages.

- [ ] **Step 6: Commit**

```bash
git add package.json packages/ server/package.json server/tsconfig.json
git commit -m "chore: initialize monorepo with server and shared packages"
```

---

### Task 2: Create the Express server with health check

**Files:**
- Create: `server/src/index.ts`
- Create: `server/src/app.ts`
- Create: `server/src/health.test.ts`

- [ ] **Step 1: Write the failing test**

Create `server/src/health.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';

describe('GET /api/v1/health', () => {
  it('returns 200 with status ok', async () => {
    const { app } = await import('./app.js');
    const response = await fetch('http://localhost:0/api/v1/health');
    // We'll test via supertest-like approach after app is created
    // For now, test the app module exports
    expect(app).toBeDefined();
  });
});
```

Wait — we need a proper test approach. Let's use `supertest` for HTTP testing.

Update `server/package.json` devDependencies to add:

```json
"supertest": "^7.1.0",
"@types/supertest": "^6.0.2"
```

Run: `npm install` from root.

Now create `server/src/health.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from './app.js';

describe('GET /api/v1/health', () => {
  it('returns 200 with status ok', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
cd server && npx vitest run src/health.test.ts
```

Expected: FAIL — `./app.js` does not exist.

- [ ] **Step 3: Write the Express app**

Create `server/src/app.ts`:

```typescript
import express from 'express';

export const app = express();

app.use(express.json());

app.get('/api/v1/health', (_req, res) => {
  res.json({ status: 'ok' });
});
```

Create `server/src/index.ts`:

```typescript
import { app } from './app.js';

const PORT = process.env.PORT ?? 4000;

app.listen(PORT, () => {
  console.log(`Iron Gavel API running on port ${PORT}`);
});
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
cd server && npx vitest run src/health.test.ts
```

Expected: PASS

- [ ] **Step 5: Verify the server starts**

Run:

```bash
cd server && npx tsx src/index.ts &
sleep 2
curl http://localhost:4000/api/v1/health
kill %1
```

Expected: `{"status":"ok"}`

- [ ] **Step 6: Commit**

```bash
git add server/src/ server/package.json
git commit -m "feat: add Express server with health check endpoint"
```

---

### Task 3: Write the Prisma schema

**Files:**
- Create: `server/prisma/schema.prisma`

This is the largest task — the full database schema mapping all entities from `types.ts`.

- [ ] **Step 1: Initialize Prisma**

Run:

```bash
cd server && npx prisma init --datasource-provider postgresql
```

This creates `server/prisma/schema.prisma` and `server/.env`.

- [ ] **Step 2: Write the full schema**

Replace `server/prisma/schema.prisma` with:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================================================
// USERS & AUTH
// ============================================================================

enum UserRole {
  Admin
  Attorney
  Paralegal
  Client
}

model User {
  id           String   @id @default(cuid())
  email        String   @unique
  passwordHash String
  name         String
  role         UserRole
  defaultRate  Float?
  avatarUrl    String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  // Relations
  sessions              Session[]
  twoFactorAuth         TwoFactorAuth?
  assignedTasks         Task[]            @relation("AssignedTo")
  createdTasks          Task[]            @relation("AssignedBy")
  timeEntries           TimeEntry[]
  responsibleMatters    Matter[]          @relation("ResponsibleAttorney")
  originatingMatters    Matter[]          @relation("OriginatingAttorney")
  documentVersions      DocumentVersion[]
  auditLogs             AuditLog[]
  sentPortalMessages    PortalMessage[]
  matterAccess          MatterAccess[]
}

model Session {
  id         String   @id @default(cuid())
  userId     String
  deviceName String?
  ipAddress  String?
  userAgent  String?
  expiresAt  DateTime
  createdAt  DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model TwoFactorAuth {
  id          String  @id @default(cuid())
  userId      String  @unique
  method      String  // SMS, Email, Authenticator App
  secret      String?
  enabled     Boolean @default(false)
  backupCodes Json?   // string[]

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}

// ============================================================================
// MATTERS & CONTACTS
// ============================================================================

enum MatterStatus {
  Open
  Closed
  Pending
}

enum MatterPermission {
  Firm
  Private
  Selective
}

enum BillingType {
  Hourly
  FlatFee
  Contingency
}

model Matter {
  id                    String           @id @default(cuid())
  name                  String
  client                String           // display name — linked via MatterContact
  status                MatterStatus     @default(Open)
  openDate              DateTime
  notes                 String           @default("")
  billingType           BillingType
  billingRate           Float?
  billingFee            Float?
  permissions           MatterPermission @default(Firm)
  responsibleAttorneyId String?
  originatingAttorneyId String?
  practiceArea          String?
  stageId               String?
  lastStageChangeDate   DateTime?
  estimatedValue        Float?
  trustBalance          Float           @default(0)
  description           String?
  location              String?
  clientReferenceNumber String?
  createdAt             DateTime         @default(now())
  updatedAt             DateTime         @updatedAt

  // Recurring billing
  recurringEnabled   Boolean @default(false)
  recurringFrequency String? // Monthly, Quarterly, Yearly
  recurringAmount    Float?
  recurringNextDate  DateTime?

  // Settlement (contingency)
  settlementGross         Float?
  settlementFeePercent    Float?
  settlementFeeAmount     Float?
  settlementCosts         Float?
  settlementMedicalLiens  Float?
  settlementNetToClient   Float?
  settlementStatus        String? // Pending, Draft, Finalized, Paid
  settlementDate          DateTime?

  // Relations
  responsibleAttorney User?            @relation("ResponsibleAttorney", fields: [responsibleAttorneyId], references: [id])
  originatingAttorney User?            @relation("OriginatingAttorney", fields: [originatingAttorneyId], references: [id])
  tasks               Task[]
  documents           Document[]
  timeEntries         TimeEntry[]
  expenses            Expense[]
  invoices            Invoice[]
  transactions        Transaction[]
  events              Event[]
  communications      Communication[]
  relatedParties      RelatedParty[]
  matterContacts      MatterContact[]
  matterAccess        MatterAccess[]
  portalMessages      PortalMessage[]
  sharedDocuments     SharedDocument[]
  customFields        Json?            // { [fieldId]: value }
}

// Join table for matter-level RBAC (Selective permissions)
model MatterAccess {
  id       String @id @default(cuid())
  matterId String
  userId   String

  matter Matter @relation(fields: [matterId], references: [id], onDelete: Cascade)
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([matterId, userId])
}

enum ContactType {
  Client
  Witness
  Counsel
  PotentialClient
}

model Contact {
  id              String      @id @default(cuid())
  name            String
  email           String      @default("")
  phone           String      @default("")
  type            ContactType
  hasPortalAccess Boolean     @default(false)
  isCompany       Boolean     @default(false)
  prefix          String?
  firstName       String?
  middleName      String?
  lastName        String?
  companyName     String?
  title           String?
  dob             DateTime?
  notes           String?
  tags            Json?       // string[]
  value           Float?
  photoUrl        String?
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt

  // Nested contact info stored as JSON for simplicity
  emails    Json? // ContactEmail[]
  phones    Json? // ContactPhone[]
  addresses Json? // ContactAddress[]
  websites  Json? // ContactWebsite[]

  // Relations
  matterContacts  MatterContact[]
  sharedDocuments SharedDocument[]
}

model MatterContact {
  id        String @id @default(cuid())
  matterId  String
  contactId String
  role      String @default("Client") // Client, Witness, Counsel, etc.

  matter  Matter  @relation(fields: [matterId], references: [id], onDelete: Cascade)
  contact Contact @relation(fields: [contactId], references: [id], onDelete: Cascade)

  @@unique([matterId, contactId])
}

model RelatedParty {
  id       String  @id @default(cuid())
  matterId String
  name     String
  role     String  // Opposing Counsel, Opposing Party, Judge, Witness, etc.
  email    String?
  phone    String?
  notes    String?

  matter Matter @relation(fields: [matterId], references: [id], onDelete: Cascade)
}

// ============================================================================
// BILLING & TRUST
// ============================================================================

model TimeEntry {
  id          String   @id @default(cuid())
  matterId    String
  userId      String
  date        DateTime
  description String
  duration    Float    // hours
  rate        Float
  isBilled    Boolean  @default(false)
  createdAt   DateTime @default(now())

  matter Matter @relation(fields: [matterId], references: [id], onDelete: Cascade)
  user   User   @relation(fields: [userId], references: [id])
}

enum ExpenseType {
  HardCost
  SoftCost
}

model Expense {
  id          String      @id @default(cuid())
  matterId    String
  date        DateTime
  description String
  amount      Float
  type        ExpenseType
  isBilled    Boolean     @default(false)
  createdAt   DateTime    @default(now())

  matter Matter @relation(fields: [matterId], references: [id], onDelete: Cascade)
}

enum InvoiceStatus {
  Paid
  Unpaid
  Overdue
}

model Invoice {
  id         String        @id @default(cuid())
  matterId   String
  issueDate  DateTime
  dueDate    DateTime
  amount     Float
  status     InvoiceStatus @default(Unpaid)
  balance    Float?
  clientName String?
  lastSentDate DateTime?
  createdAt  DateTime      @default(now())

  matter Matter @relation(fields: [matterId], references: [id], onDelete: Cascade)
}

enum TransactionType {
  Deposit
  Payment
  Transfer
}

enum LedgerType {
  Operating
  Trust
}

model Transaction {
  id          String          @id @default(cuid())
  matterId    String
  date        DateTime
  type        TransactionType
  ledger      LedgerType
  description String
  amount      Float           // always positive
  fromAccount String?
  toAccount   String?
  createdAt   DateTime        @default(now())

  matter Matter @relation(fields: [matterId], references: [id], onDelete: Cascade)
}

// ============================================================================
// DOCUMENTS & FILES
// ============================================================================

model Document {
  id              String   @id @default(cuid())
  matterId        String
  name            String
  category        String
  filePath        String?  // path on NAS volume
  size            String   @default("0")
  folder          String?
  batesNumber     String?
  isPrivileged    Boolean  @default(false)
  privilegeReason String?
  exhibitNumber   String?
  discoveryStatus String?  // Draft, Produced, Received
  sharedWithClient Boolean @default(false)
  esignStatus     String?  // None, Sent, Delivered, Signed, etc.
  esignRequestedDate DateTime?
  esignCompletedDate DateTime?
  esignRecipient  String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  matter          Matter            @relation(fields: [matterId], references: [id], onDelete: Cascade)
  versions        DocumentVersion[]
  sharedDocuments SharedDocument[]
}

model DocumentVersion {
  id           String   @id @default(cuid())
  documentId   String
  version      Int
  filePath     String
  uploadedAt   DateTime @default(now())
  uploadedById String

  document   Document @relation(fields: [documentId], references: [id], onDelete: Cascade)
  uploadedBy User     @relation(fields: [uploadedById], references: [id])
}

// ============================================================================
// CALENDAR & TASKS
// ============================================================================

model Task {
  id              String   @id @default(cuid())
  matterId        String
  description     String
  notes           String?
  dueDate         DateTime
  completed       Boolean  @default(false)
  priority        String   @default("Medium") // High, Medium, Low
  recurrence      String?  // Weekly, Monthly
  assignedUserId  String?
  assignedByUserId String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  matter     Matter @relation(fields: [matterId], references: [id], onDelete: Cascade)
  assignedTo User?  @relation("AssignedTo", fields: [assignedUserId], references: [id])
  assignedBy User?  @relation("AssignedBy", fields: [assignedByUserId], references: [id])
}

model Event {
  id               String   @id @default(cuid())
  title            String
  date             DateTime
  startTime        String
  endTime          String
  matterId         String
  eventTypeId      String?
  type             String   // Meeting, Deposition, Court Hearing, Call
  location         String   @default("")
  calendarId       String?
  allDay           Boolean  @default(false)
  description      String?
  recurrence       Json?    // { frequency, interval, endDate, count, daysOfWeek }
  isRecurringInstance Boolean @default(false)
  recurringEventId String?
  attendees        Json?    // string[]
  reminders        Json?    // { time, type }[]
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  matter Matter @relation(fields: [matterId], references: [id], onDelete: Cascade)
}

// ============================================================================
// COMMUNICATION
// ============================================================================

model Communication {
  id           String   @id @default(cuid())
  matterId     String
  type         String   // Email, Call, Meeting
  subject      String
  date         DateTime
  participants Json     // string[]
  summary      String   @default("")
  createdAt    DateTime @default(now())

  matter Matter @relation(fields: [matterId], references: [id], onDelete: Cascade)
}

// ============================================================================
// AUDIT & COMPLIANCE
// ============================================================================

model AuditLog {
  id           String   @id @default(cuid())
  timestamp    DateTime @default(now())
  userId       String
  userName     String
  action       String   // CREATE, UPDATE, DELETE, VIEW, etc.
  entityType   String   // Matter, Document, Contact, etc.
  entityId     String
  entityName   String?
  changes      Json?    // AuditChange[]
  ipAddress    String?
  userAgent    String?
  sessionId    String?
  hash         String
  previousHash String?

  user User @relation(fields: [userId], references: [id])

  @@index([entityType, entityId])
  @@index([userId])
  @@index([timestamp])
}

// ============================================================================
// CLIENT PORTAL
// ============================================================================

model PortalMessage {
  id        String    @id @default(cuid())
  matterId  String
  senderId  String
  content   String
  readAt    DateTime?
  createdAt DateTime  @default(now())

  matter Matter @relation(fields: [matterId], references: [id], onDelete: Cascade)
  sender User   @relation(fields: [senderId], references: [id])
}

model SharedDocument {
  id         String    @id @default(cuid())
  documentId String
  contactId  String
  sharedAt   DateTime  @default(now())
  accessedAt DateTime?

  document Document @relation(fields: [documentId], references: [id], onDelete: Cascade)
  contact  Contact  @relation(fields: [contactId], references: [id], onDelete: Cascade)

  @@unique([documentId, contactId])
}
```

- [ ] **Step 3: Set the DATABASE_URL**

Create `server/.env`:

```
DATABASE_URL="postgresql://irongavel:irongavel@localhost:5432/irongavel?schema=public"
```

Add `server/.env` to `.gitignore` if not already covered. Create `server/.env.example`:

```
DATABASE_URL="postgresql://irongavel:irongavel@localhost:5432/irongavel?schema=public"
```

- [ ] **Step 4: Generate the Prisma client**

Run:

```bash
cd server && npx prisma generate
```

Expected: "Prisma Client generated successfully"

- [ ] **Step 5: Commit**

```bash
git add server/prisma/schema.prisma server/.env.example .gitignore
git commit -m "feat: add Prisma schema with all entity tables"
```

---

### Task 4: Docker Compose setup

**Files:**
- Create: `server/Dockerfile`
- Modify: `docker-compose.yml` (if exists from PR #2, or create new)
- Create: `.env.example` (root — Docker env vars)

- [ ] **Step 1: Create the server Dockerfile**

Create `server/Dockerfile`:

```dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY server/package.json ./server/
COPY packages/shared/package.json ./packages/shared/
RUN npm ci --workspace=@iron-gavel/server --workspace=@iron-gavel/shared
COPY packages/shared/ ./packages/shared/
COPY server/ ./server/
RUN npm run build --workspace=@iron-gavel/shared
RUN cd server && npx prisma generate
RUN npm run build --workspace=@iron-gavel/server

FROM node:20-alpine
WORKDIR /app
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/server/dist ./server/dist
COPY --from=build /app/server/node_modules ./server/node_modules
COPY --from=build /app/server/prisma ./server/prisma
COPY --from=build /app/server/package.json ./server/
COPY --from=build /app/packages/shared/dist ./packages/shared/dist
COPY --from=build /app/packages/shared/package.json ./packages/shared/
EXPOSE 4000
WORKDIR /app/server
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
```

- [ ] **Step 2: Create Docker Compose for the full stack**

Create `docker-compose.yml` at repo root:

```yaml
services:
  db:
    image: postgres:16-alpine
    container_name: iron-gavel-db
    environment:
      POSTGRES_USER: irongavel
      POSTGRES_PASSWORD: ${DB_PASSWORD:-irongavel}
      POSTGRES_DB: irongavel
    volumes:
      - pgdata:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U irongavel"]
      interval: 10s
      timeout: 5s
      retries: 5

  server:
    build:
      context: .
      dockerfile: server/Dockerfile
    container_name: iron-gavel-api
    environment:
      DATABASE_URL: postgresql://irongavel:${DB_PASSWORD:-irongavel}@db:5432/irongavel?schema=public
      PORT: 4000
      GEMINI_API_KEY: ${GEMINI_API_KEY:-}
    ports:
      - "4000:4000"
    volumes:
      - filedata:/data/iron-gavel/files
    depends_on:
      db:
        condition: service_healthy
    restart: unless-stopped

  frontend:
    build:
      context: .
      dockerfile: Dockerfile
      args:
        GEMINI_API_KEY: ${GEMINI_API_KEY:-}
    container_name: iron-gavel-web
    ports:
      - "3000:80"
    depends_on:
      - server
    restart: unless-stopped

volumes:
  pgdata:
  filedata:
```

- [ ] **Step 3: Create the root .env.example**

Create `.env.example` at repo root:

```bash
# Database
DB_PASSWORD=change_me_in_production

# Gemini AI (optional — required for AI features)
GEMINI_API_KEY=your_gemini_api_key_here
```

- [ ] **Step 4: Update .gitignore**

Append to `.gitignore`:

```
# Server
server/dist
server/.env
server/node_modules

# Shared package
packages/shared/dist

# Docker
.env
```

- [ ] **Step 5: Commit**

```bash
git add server/Dockerfile docker-compose.yml .env.example .gitignore
git commit -m "feat: add Docker Compose with PostgreSQL, API server, and frontend"
```

---

### Task 5: Run the first migration

**Files:**
- Creates: `server/prisma/migrations/` (auto-generated by Prisma)

This task requires a running PostgreSQL instance. We'll use Docker for that.

- [ ] **Step 1: Start just the database container**

```bash
docker compose up db -d
```

Wait for healthy:

```bash
docker compose ps
```

Expected: `iron-gavel-db` shows "healthy".

- [ ] **Step 2: Run the migration**

```bash
cd server && DATABASE_URL="postgresql://irongavel:irongavel@localhost:5432/irongavel?schema=public" npx prisma migrate dev --name init
```

Expected: Creates `server/prisma/migrations/<timestamp>_init/migration.sql` and applies it.

- [ ] **Step 3: Verify tables exist**

```bash
docker exec iron-gavel-db psql -U irongavel -d irongavel -c "\dt"
```

Expected: Lists all tables — User, Matter, Contact, Task, Event, Document, DocumentVersion, TimeEntry, Expense, Invoice, Transaction, Communication, AuditLog, Session, TwoFactorAuth, MatterContact, MatterAccess, RelatedParty, PortalMessage, SharedDocument, plus Prisma migration tables.

- [ ] **Step 4: Commit the migration**

```bash
git add server/prisma/migrations/
git commit -m "feat: run initial database migration"
```

---

### Task 6: Seed the database with test data

**Files:**
- Create: `server/prisma/seed.ts`

- [ ] **Step 1: Write the seed file**

Create `server/prisma/seed.ts`:

```typescript
import { PrismaClient, UserRole, MatterStatus, BillingType, MatterPermission, ContactType, ExpenseType, InvoiceStatus, TransactionType, LedgerType } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

function hashPassword(password: string): string {
  // Placeholder — Plan 1B will replace with bcrypt
  return crypto.createHash('sha256').update(password).digest('hex');
}

async function main() {
  console.log('Seeding database...');

  // Users
  const admin = await prisma.user.create({
    data: {
      id: 'USER_1',
      email: 'christopher.washington@greatelephantlaw.com',
      passwordHash: hashPassword('admin123'),
      name: 'Christopher Washington',
      role: UserRole.Admin,
      defaultRate: 350,
      avatarUrl: '/christopher-washington.jpg',
    },
  });

  const attorney = await prisma.user.create({
    data: {
      id: 'USER_2',
      email: 'rozshelle@greatelephantlaw.com',
      passwordHash: hashPassword('attorney123'),
      name: 'Rozshelle Laher',
      role: UserRole.Attorney,
      defaultRate: 300,
    },
  });

  const paralegal = await prisma.user.create({
    data: {
      id: 'USER_3',
      email: 'riza@greatelephantlaw.com',
      passwordHash: hashPassword('paralegal123'),
      name: 'Riza Fortes',
      role: UserRole.Paralegal,
      defaultRate: 150,
    },
  });

  // Contacts
  const contact1 = await prisma.contact.create({
    data: {
      id: 'CON_1',
      name: 'Arthur Dent',
      email: 'arthur@dent.com',
      phone: '555-4242',
      type: ContactType.Client,
      hasPortalAccess: true,
      isCompany: false,
    },
  });

  const contact2 = await prisma.contact.create({
    data: {
      id: 'CON_2',
      name: 'Trillian Astra',
      email: 'trillian@heartofgold.com',
      phone: '555-1234',
      type: ContactType.Client,
      hasPortalAccess: false,
      isCompany: false,
    },
  });

  // Matters
  const matter1 = await prisma.matter.create({
    data: {
      id: 'MAT-001',
      name: 'Dent v. Vogon Construction Co.',
      client: 'Arthur Dent',
      status: MatterStatus.Open,
      openDate: new Date('2025-06-15'),
      notes: 'Property dispute — Vogon bypass demolition of client home.',
      billingType: BillingType.Hourly,
      billingRate: 350,
      permissions: MatterPermission.Firm,
      responsibleAttorneyId: admin.id,
      practiceArea: 'Litigation',
      estimatedValue: 150000,
    },
  });

  const matter2 = await prisma.matter.create({
    data: {
      id: 'MAT-002',
      name: 'Astra Employment Dispute',
      client: 'Trillian Astra',
      status: MatterStatus.Open,
      openDate: new Date('2025-09-01'),
      notes: 'Wrongful termination from Magrathea Corp.',
      billingType: BillingType.Contingency,
      billingFee: 33.33,
      permissions: MatterPermission.Firm,
      responsibleAttorneyId: attorney.id,
      practiceArea: 'Personal Injury',
      estimatedValue: 250000,
    },
  });

  // Link contacts to matters
  await prisma.matterContact.createMany({
    data: [
      { matterId: matter1.id, contactId: contact1.id, role: 'Client' },
      { matterId: matter2.id, contactId: contact2.id, role: 'Client' },
    ],
  });

  // Related parties
  await prisma.relatedParty.create({
    data: {
      matterId: matter1.id,
      name: 'Prostetnic Vogon Jeltz',
      role: 'Opposing Party',
      notes: 'Vogon Construction Company representative',
    },
  });

  // Tasks
  await prisma.task.createMany({
    data: [
      {
        matterId: matter1.id,
        description: 'File initial complaint',
        dueDate: new Date('2026-04-10'),
        priority: 'High',
        assignedUserId: admin.id,
      },
      {
        matterId: matter1.id,
        description: 'Request production of documents',
        dueDate: new Date('2026-04-20'),
        priority: 'Medium',
        assignedUserId: paralegal.id,
      },
      {
        matterId: matter2.id,
        description: 'Draft demand letter',
        dueDate: new Date('2026-04-15'),
        priority: 'High',
        assignedUserId: attorney.id,
      },
    ],
  });

  // Time entries
  await prisma.timeEntry.createMany({
    data: [
      {
        matterId: matter1.id,
        userId: admin.id,
        date: new Date('2026-03-28'),
        description: 'Initial client consultation and case review',
        duration: 1.5,
        rate: 350,
      },
      {
        matterId: matter1.id,
        userId: paralegal.id,
        date: new Date('2026-03-29'),
        description: 'Research local property law precedents',
        duration: 3.0,
        rate: 150,
      },
      {
        matterId: matter2.id,
        userId: attorney.id,
        date: new Date('2026-03-30'),
        description: 'Review employment contract and termination docs',
        duration: 2.0,
        rate: 300,
      },
    ],
  });

  // Expenses
  await prisma.expense.createMany({
    data: [
      {
        matterId: matter1.id,
        date: new Date('2026-03-28'),
        description: 'Court filing fee',
        amount: 435,
        type: ExpenseType.HardCost,
      },
      {
        matterId: matter2.id,
        date: new Date('2026-03-30'),
        description: 'Process server fee',
        amount: 85,
        type: ExpenseType.HardCost,
      },
    ],
  });

  // Invoices
  await prisma.invoice.createMany({
    data: [
      {
        matterId: matter1.id,
        issueDate: new Date('2026-03-31'),
        dueDate: new Date('2026-04-30'),
        amount: 1410,
        status: InvoiceStatus.Unpaid,
        balance: 1410,
        clientName: 'Arthur Dent',
      },
    ],
  });

  // Transactions (trust deposit)
  await prisma.transaction.createMany({
    data: [
      {
        matterId: matter1.id,
        date: new Date('2026-03-25'),
        type: TransactionType.Deposit,
        ledger: LedgerType.Trust,
        description: 'Initial retainer deposit',
        amount: 5000,
      },
      {
        matterId: matter1.id,
        date: new Date('2026-03-28'),
        type: TransactionType.Payment,
        ledger: LedgerType.Trust,
        description: 'Court filing fee from trust',
        amount: 435,
      },
    ],
  });

  // Events
  await prisma.event.createMany({
    data: [
      {
        matterId: matter1.id,
        title: 'Initial Case Strategy Meeting',
        date: new Date('2026-04-05'),
        startTime: '10:00 AM',
        endTime: '11:00 AM',
        type: 'Meeting',
        location: 'Conference Room A',
      },
      {
        matterId: matter2.id,
        title: 'Deposition of HR Director',
        date: new Date('2026-04-18'),
        startTime: '2:00 PM',
        endTime: '4:00 PM',
        type: 'Deposition',
        location: 'Opposing counsel office',
      },
    ],
  });

  // Communications
  await prisma.communication.createMany({
    data: [
      {
        matterId: matter1.id,
        type: 'Email',
        subject: 'Case update — Dent v. Vogon',
        date: new Date('2026-03-28'),
        participants: JSON.parse('["Arthur Dent", "Christopher Washington"]'),
        summary: 'Discussed initial strategy and timeline for filing.',
      },
    ],
  });

  // Documents (metadata only — no files yet)
  await prisma.document.create({
    data: {
      matterId: matter1.id,
      name: 'Initial Complaint Draft.pdf',
      category: 'Pleadings',
      size: '245 KB',
      versions: {
        create: {
          version: 1,
          filePath: '/data/iron-gavel/files/matters/MAT-001/complaint-v1.pdf',
          uploadedById: admin.id,
        },
      },
    },
  });

  // Audit log (first entry)
  const hashContent = JSON.stringify({ action: 'SEED', timestamp: new Date().toISOString() });
  const hash = crypto.createHash('sha256').update(hashContent).digest('hex');

  await prisma.auditLog.create({
    data: {
      userId: admin.id,
      userName: admin.name,
      action: 'CREATE',
      entityType: 'System',
      entityId: 'SEED',
      entityName: 'Database Seed',
      hash: hash,
    },
  });

  console.log('Seed complete.');
  console.log(`  Users: 3`);
  console.log(`  Contacts: 2`);
  console.log(`  Matters: 2`);
  console.log(`  Tasks: 3`);
  console.log(`  Time Entries: 3`);
  console.log(`  Expenses: 2`);
  console.log(`  Invoices: 1`);
  console.log(`  Transactions: 2`);
  console.log(`  Events: 2`);
  console.log(`  Communications: 1`);
  console.log(`  Documents: 1`);
  console.log(`  Audit Logs: 1`);
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

- [ ] **Step 2: Run the seed**

```bash
cd server && DATABASE_URL="postgresql://irongavel:irongavel@localhost:5432/irongavel?schema=public" npx prisma db seed
```

Expected output:

```
Seeding database...
Seed complete.
  Users: 3
  Contacts: 2
  Matters: 2
  Tasks: 3
  ...
```

- [ ] **Step 3: Verify data in the database**

```bash
docker exec iron-gavel-db psql -U irongavel -d irongavel -c 'SELECT id, name, role FROM "User";'
```

Expected:

```
   id    |         name          |   role
---------+-----------------------+-----------
 USER_1  | Christopher Washington | Admin
 USER_2  | Rozshelle Laher        | Attorney
 USER_3  | Riza Fortes            | Paralegal
```

- [ ] **Step 4: Commit**

```bash
git add server/prisma/seed.ts
git commit -m "feat: add database seed with test data for all entities"
```

---

### Task 7: Verify full Docker stack

**Files:** None — this is a validation task.

- [ ] **Step 1: Stop any running containers**

```bash
docker compose down
```

- [ ] **Step 2: Build and start the full stack**

```bash
docker compose up --build -d
```

Expected: Three containers start — `iron-gavel-db`, `iron-gavel-api`, `iron-gavel-web`.

- [ ] **Step 3: Check all containers are healthy**

```bash
docker compose ps
```

Expected: All three containers show "Up" status.

- [ ] **Step 4: Test the API health endpoint**

```bash
curl http://localhost:4000/api/v1/health
```

Expected: `{"status":"ok"}`

- [ ] **Step 5: Test the frontend loads**

```bash
curl -s http://localhost:3000 | head -5
```

Expected: HTML response containing `<!DOCTYPE html>`.

- [ ] **Step 6: Stop the stack**

```bash
docker compose down
```

- [ ] **Step 7: Commit any remaining changes**

If there were any adjustments needed during validation:

```bash
git add -A && git commit -m "fix: adjustments from Docker stack validation"
```

If no changes needed, skip this step.

---

### Task 8: Add Prisma Studio script for development

**Files:**
- Modify: `server/package.json`

- [ ] **Step 1: Add studio script to server package.json**

Add to the `scripts` section of `server/package.json`:

```json
"db:studio": "prisma studio"
```

- [ ] **Step 2: Verify Prisma Studio launches**

With the database running:

```bash
docker compose up db -d
cd server && DATABASE_URL="postgresql://irongavel:irongavel@localhost:5432/irongavel?schema=public" npx prisma studio
```

Expected: Opens a browser at `http://localhost:5555` showing all tables and seeded data.

Stop it with Ctrl+C.

- [ ] **Step 3: Commit**

```bash
git add server/package.json
git commit -m "chore: add Prisma Studio script for database browsing"
```
