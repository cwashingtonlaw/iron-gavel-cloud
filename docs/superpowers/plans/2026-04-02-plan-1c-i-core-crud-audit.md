# Plan 1C-i: Core CRUD + Audit Logging

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add audit logging middleware and full CRUD endpoints for Matters, Contacts, Tasks, Events, and Communications — all protected by authentication and role-based authorization.

**Architecture:** Each resource gets its own router file with standard REST endpoints (GET list, GET by id, POST create, PUT update, DELETE). All mutation endpoints pass through audit logging middleware that records changes with hash-chained integrity. Routers use authenticate + authorize middleware from Plan 1B. Matter-scoped resources (tasks, events, communications) enforce matter permissions.

**Tech Stack:** Express routers, Prisma (existing), Zod validation, crypto (Node built-in for audit hashing), vitest + supertest (existing)

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
server/src/
├── middleware/
│   └── auditLog.ts            — Audit logging middleware (hash-chained)
├── routes/
│   ├── matters.router.ts      — CRUD for matters
│   ├── matters.test.ts        — Integration tests
│   ├── contacts.router.ts     — CRUD for contacts
│   ├── contacts.test.ts       — Integration tests
│   ├── tasks.router.ts        — CRUD for tasks (matter-scoped)
│   ├── tasks.test.ts          — Integration tests
│   ├── events.router.ts       — CRUD for events (matter-scoped)
│   ├── communications.router.ts — CRUD for communications (matter-scoped)
│   └── index.ts               — Mounts all routers
├── app.ts                     — (modify) Mount routes/index
```

---

### Task 1: Audit logging middleware

**Files:**
- Create: `server/src/middleware/auditLog.ts`
- Create: `server/src/middleware/auditLog.test.ts`

- [ ] **Step 1: Write the failing test**

Create `server/src/middleware/auditLog.test.ts`:

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import { authenticate } from './authenticate.js';
import { auditLog } from './auditLog.js';
import { generateAccessToken } from '../auth/auth.service.js';
import { prisma } from '../lib/prisma.js';

function createTestApp() {
  const app = express();
  app.use(express.json());
  app.post(
    '/test-audit',
    authenticate,
    auditLog('CREATE', 'Matter'),
    (_req, res) => { res.status(201).json({ id: 'test-123' }); }
  );
  return app;
}

beforeAll(async () => {
  await prisma.user.upsert({
    where: { id: 'AUDIT_USER' },
    update: {},
    create: { id: 'AUDIT_USER', email: 'audit-test@test.com', passwordHash: 'x', name: 'Audit Tester', role: 'Admin' },
  });
});

afterAll(async () => {
  await prisma.auditLog.deleteMany({ where: { userId: 'AUDIT_USER' } });
  await prisma.user.deleteMany({ where: { id: 'AUDIT_USER' } });
  await prisma.$disconnect();
});

describe('auditLog middleware', () => {
  const testApp = createTestApp();

  it('creates an audit log entry on successful response', async () => {
    const token = generateAccessToken({ userId: 'AUDIT_USER', role: 'Admin' });
    await request(testApp)
      .post('/test-audit')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Test Matter' });

    const logs = await prisma.auditLog.findMany({ where: { userId: 'AUDIT_USER' } });
    expect(logs.length).toBeGreaterThanOrEqual(1);

    const log = logs[logs.length - 1];
    expect(log.action).toBe('CREATE');
    expect(log.entityType).toBe('Matter');
    expect(log.hash).toBeDefined();
    expect(log.hash.length).toBe(64); // SHA-256 hex
  });

  it('chains hashes — second log references first', async () => {
    const token = generateAccessToken({ userId: 'AUDIT_USER', role: 'Admin' });
    await request(testApp)
      .post('/test-audit')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Another' });

    const logs = await prisma.auditLog.findMany({
      where: { userId: 'AUDIT_USER' },
      orderBy: { timestamp: 'asc' },
    });

    if (logs.length >= 2) {
      const latest = logs[logs.length - 1];
      const previous = logs[logs.length - 2];
      expect(latest.previousHash).toBe(previous.hash);
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run inside Docker. Expected: FAIL — module not found.

- [ ] **Step 3: Implement audit log middleware**

Create `server/src/middleware/auditLog.ts`:

```typescript
import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { prisma } from '../lib/prisma.js';

export function auditLog(action: string, entityType: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const originalJson = res.json.bind(res);

    res.json = function (body: any) {
      // Only log on successful mutations (2xx status)
      if (res.statusCode >= 200 && res.statusCode < 300 && req.user) {
        const entityId = body?.id ?? req.params?.id ?? req.params?.matterId ?? 'unknown';

        createAuditEntry({
          userId: req.user.userId,
          userName: req.user.role, // We only have role in JWT; userName filled by lookup if needed
          action,
          entityType,
          entityId: String(entityId),
          entityName: body?.name,
          changes: action === 'CREATE' ? req.body : undefined,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
        }).catch(() => {}); // Don't block response on audit failure
      }

      return originalJson(body);
    };

    next();
  };
}

async function createAuditEntry(data: {
  userId: string;
  userName: string;
  action: string;
  entityType: string;
  entityId: string;
  entityName?: string;
  changes?: any;
  ipAddress?: string;
  userAgent?: string;
}) {
  // Get the last audit log for hash chaining
  const lastLog = await prisma.auditLog.findFirst({
    orderBy: { timestamp: 'desc' },
    select: { hash: true },
  });

  const hashContent = JSON.stringify({
    ...data,
    timestamp: new Date().toISOString(),
    previousHash: lastLog?.hash,
  });
  const hash = crypto.createHash('sha256').update(hashContent).digest('hex');

  await prisma.auditLog.create({
    data: {
      ...data,
      changes: data.changes ?? undefined,
      hash,
      previousHash: lastLog?.hash ?? undefined,
    },
  });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run inside Docker. Expected: 2 tests PASS.

- [ ] **Step 5: Commit**

```bash
cd /tmp/iron-gavel-deploy && git add server/src/middleware/auditLog.ts server/src/middleware/auditLog.test.ts
git commit -m "feat: add hash-chained audit logging middleware"
```

---

### Task 2: Matters CRUD router

**Files:**
- Create: `server/src/routes/matters.router.ts`
- Create: `server/src/routes/matters.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `server/src/routes/matters.test.ts`:

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { prisma } from '../lib/prisma.js';
import { generateAccessToken } from '../auth/auth.service.js';

const adminToken = generateAccessToken({ userId: 'USER_1', role: 'Admin' });
const attorneyToken = generateAccessToken({ userId: 'USER_2', role: 'Attorney' });
let createdMatterId: string;

beforeAll(async () => {
  await prisma.user.upsert({
    where: { id: 'USER_1' },
    update: {},
    create: { id: 'USER_1', email: 'crud-admin@test.com', passwordHash: 'x', name: 'Admin', role: 'Admin', defaultRate: 350 },
  });
  await prisma.user.upsert({
    where: { id: 'USER_2' },
    update: {},
    create: { id: 'USER_2', email: 'crud-attorney@test.com', passwordHash: 'x', name: 'Attorney', role: 'Attorney', defaultRate: 300 },
  });
});

afterAll(async () => {
  if (createdMatterId) {
    await prisma.matter.deleteMany({ where: { id: createdMatterId } });
  }
  await prisma.$disconnect();
});

describe('Matters CRUD', () => {
  it('POST /api/v1/matters — creates a matter', async () => {
    const res = await request(app)
      .post('/api/v1/matters')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'CRUD Test Matter',
        client: 'Test Client',
        status: 'Open',
        openDate: '2026-04-01',
        billingType: 'Hourly',
        billingRate: 350,
      });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe('CRUD Test Matter');
    expect(res.body.id).toBeDefined();
    createdMatterId = res.body.id;
  });

  it('GET /api/v1/matters — lists matters', async () => {
    const res = await request(app)
      .get('/api/v1/matters')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('GET /api/v1/matters/:id — gets a single matter', async () => {
    const res = await request(app)
      .get(`/api/v1/matters/${createdMatterId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('CRUD Test Matter');
  });

  it('PUT /api/v1/matters/:id — updates a matter', async () => {
    const res = await request(app)
      .put(`/api/v1/matters/${createdMatterId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Updated Matter Name' });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Updated Matter Name');
  });

  it('DELETE /api/v1/matters/:id — deletes a matter', async () => {
    const res = await request(app)
      .delete(`/api/v1/matters/${createdMatterId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    createdMatterId = ''; // prevent afterAll cleanup error
  });

  it('GET /api/v1/matters/:id — returns 404 for deleted matter', async () => {
    const res = await request(app)
      .get('/api/v1/matters/nonexistent')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(404);
  });

  it('POST /api/v1/matters — rejects invalid input', async () => {
    const res = await request(app)
      .post('/api/v1/matters')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: '' });

    expect(res.status).toBe(400);
  });

  it('rejects unauthenticated request', async () => {
    const res = await request(app).get('/api/v1/matters');
    expect(res.status).toBe(401);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run inside Docker. Expected: FAIL — route not found.

- [ ] **Step 3: Implement matters router**

Create `server/src/routes/matters.router.ts`:

```typescript
import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { auditLog } from '../middleware/auditLog.js';

export const mattersRouter = Router();

const staff = [authenticate, authorize('Admin', 'Attorney', 'Paralegal')];

const createSchema = z.object({
  name: z.string().min(1),
  client: z.string().min(1),
  status: z.enum(['Open', 'Closed', 'Pending']).default('Open'),
  openDate: z.string(),
  billingType: z.enum(['Hourly', 'FlatFee', 'Contingency']),
  billingRate: z.number().optional(),
  billingFee: z.number().optional(),
  notes: z.string().default(''),
  practiceArea: z.string().optional(),
  responsibleAttorneyId: z.string().optional(),
  permissions: z.enum(['Firm', 'Private', 'Selective']).default('Firm'),
  estimatedValue: z.number().optional(),
  description: z.string().optional(),
  location: z.string().optional(),
});

const updateSchema = createSchema.partial();

// GET /api/v1/matters
mattersRouter.get('/', ...staff, async (_req, res) => {
  const matters = await prisma.matter.findMany({
    orderBy: { updatedAt: 'desc' },
    include: { matterContacts: { include: { contact: true } } },
  });
  res.json(matters);
});

// GET /api/v1/matters/:id
mattersRouter.get('/:id', ...staff, async (req, res) => {
  const matter = await prisma.matter.findUnique({
    where: { id: req.params.id },
    include: {
      matterContacts: { include: { contact: true } },
      relatedParties: true,
    },
  });
  if (!matter) {
    res.status(404).json({ error: 'Matter not found' });
    return;
  }
  res.json(matter);
});

// POST /api/v1/matters
mattersRouter.post('/', ...staff, auditLog('CREATE', 'Matter'), async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
    return;
  }
  const { openDate, ...rest } = parsed.data;
  const matter = await prisma.matter.create({
    data: { ...rest, openDate: new Date(openDate) },
  });
  res.status(201).json(matter);
});

// PUT /api/v1/matters/:id
mattersRouter.put('/:id', ...staff, auditLog('UPDATE', 'Matter'), async (req, res) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
    return;
  }
  const existing = await prisma.matter.findUnique({ where: { id: req.params.id } });
  if (!existing) {
    res.status(404).json({ error: 'Matter not found' });
    return;
  }
  const { openDate, ...rest } = parsed.data;
  const matter = await prisma.matter.update({
    where: { id: req.params.id },
    data: { ...rest, ...(openDate ? { openDate: new Date(openDate) } : {}) },
  });
  res.json(matter);
});

// DELETE /api/v1/matters/:id
mattersRouter.delete('/:id', ...staff, auditLog('DELETE', 'Matter'), async (req, res) => {
  const existing = await prisma.matter.findUnique({ where: { id: req.params.id } });
  if (!existing) {
    res.status(404).json({ error: 'Matter not found' });
    return;
  }
  await prisma.matter.delete({ where: { id: req.params.id } });
  res.json({ message: 'Matter deleted' });
});
```

- [ ] **Step 4: Create route index and mount in app**

Create `server/src/routes/index.ts`:

```typescript
import { Router } from 'express';
import { mattersRouter } from './matters.router.js';

export const apiRouter = Router();

apiRouter.use('/matters', mattersRouter);
```

Update `server/src/app.ts`:

```typescript
import express from 'express';
import cookieParser from 'cookie-parser';
import { authRouter } from './auth/auth.router.js';
import { apiRouter } from './routes/index.js';

export const app = express();

app.use(express.json());
app.use(cookieParser());

app.get('/api/v1/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/v1/auth', authRouter);
app.use('/api/v1', apiRouter);
```

- [ ] **Step 5: Run tests inside Docker**

Expected: 8 tests PASS.

- [ ] **Step 6: Commit**

```bash
cd /tmp/iron-gavel-deploy && git add server/src/routes/ server/src/app.ts
git commit -m "feat: add matters CRUD with validation and audit logging"
```

---

### Task 3: Contacts CRUD router

**Files:**
- Create: `server/src/routes/contacts.router.ts`
- Create: `server/src/routes/contacts.test.ts`
- Modify: `server/src/routes/index.ts`

- [ ] **Step 1: Write the failing tests**

Create `server/src/routes/contacts.test.ts`:

```typescript
import { describe, it, expect, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { prisma } from '../lib/prisma.js';
import { generateAccessToken } from '../auth/auth.service.js';

const token = generateAccessToken({ userId: 'USER_1', role: 'Admin' });
let createdId: string;

afterAll(async () => {
  if (createdId) await prisma.contact.deleteMany({ where: { id: createdId } });
  await prisma.$disconnect();
});

describe('Contacts CRUD', () => {
  it('POST /api/v1/contacts — creates a contact', async () => {
    const res = await request(app)
      .post('/api/v1/contacts')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Jane Doe',
        email: 'jane@example.com',
        phone: '555-9999',
        type: 'Client',
      });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Jane Doe');
    createdId = res.body.id;
  });

  it('GET /api/v1/contacts — lists contacts', async () => {
    const res = await request(app)
      .get('/api/v1/contacts')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('GET /api/v1/contacts/:id — gets a single contact', async () => {
    const res = await request(app)
      .get(`/api/v1/contacts/${createdId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Jane Doe');
  });

  it('PUT /api/v1/contacts/:id — updates a contact', async () => {
    const res = await request(app)
      .put(`/api/v1/contacts/${createdId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Jane Updated' });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Jane Updated');
  });

  it('DELETE /api/v1/contacts/:id — deletes a contact', async () => {
    const res = await request(app)
      .delete(`/api/v1/contacts/${createdId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    createdId = '';
  });

  it('POST /api/v1/contacts — rejects invalid type', async () => {
    const res = await request(app)
      .post('/api/v1/contacts')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Bad', type: 'InvalidType' });

    expect(res.status).toBe(400);
  });
});
```

- [ ] **Step 2: Implement contacts router**

Create `server/src/routes/contacts.router.ts`:

```typescript
import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { auditLog } from '../middleware/auditLog.js';

export const contactsRouter = Router();

const staff = [authenticate, authorize('Admin', 'Attorney', 'Paralegal')];

const createSchema = z.object({
  name: z.string().min(1),
  email: z.string().default(''),
  phone: z.string().default(''),
  type: z.enum(['Client', 'Witness', 'Counsel', 'PotentialClient']),
  hasPortalAccess: z.boolean().default(false),
  isCompany: z.boolean().default(false),
  prefix: z.string().optional(),
  firstName: z.string().optional(),
  middleName: z.string().optional(),
  lastName: z.string().optional(),
  companyName: z.string().optional(),
  title: z.string().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
  value: z.number().optional(),
});

const updateSchema = createSchema.partial();

contactsRouter.get('/', ...staff, async (_req, res) => {
  const contacts = await prisma.contact.findMany({ orderBy: { name: 'asc' } });
  res.json(contacts);
});

contactsRouter.get('/:id', ...staff, async (req, res) => {
  const contact = await prisma.contact.findUnique({
    where: { id: req.params.id },
    include: { matterContacts: { include: { matter: true } } },
  });
  if (!contact) { res.status(404).json({ error: 'Contact not found' }); return; }
  res.json(contact);
});

contactsRouter.post('/', ...staff, auditLog('CREATE', 'Contact'), async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() }); return; }
  const contact = await prisma.contact.create({ data: parsed.data });
  res.status(201).json(contact);
});

contactsRouter.put('/:id', ...staff, auditLog('UPDATE', 'Contact'), async (req, res) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() }); return; }
  const existing = await prisma.contact.findUnique({ where: { id: req.params.id } });
  if (!existing) { res.status(404).json({ error: 'Contact not found' }); return; }
  const contact = await prisma.contact.update({ where: { id: req.params.id }, data: parsed.data });
  res.json(contact);
});

contactsRouter.delete('/:id', ...staff, auditLog('DELETE', 'Contact'), async (req, res) => {
  const existing = await prisma.contact.findUnique({ where: { id: req.params.id } });
  if (!existing) { res.status(404).json({ error: 'Contact not found' }); return; }
  await prisma.contact.delete({ where: { id: req.params.id } });
  res.json({ message: 'Contact deleted' });
});
```

- [ ] **Step 3: Add to route index**

Update `server/src/routes/index.ts`:

```typescript
import { Router } from 'express';
import { mattersRouter } from './matters.router.js';
import { contactsRouter } from './contacts.router.js';

export const apiRouter = Router();

apiRouter.use('/matters', mattersRouter);
apiRouter.use('/contacts', contactsRouter);
```

- [ ] **Step 4: Run tests inside Docker**

Expected: 6 tests PASS.

- [ ] **Step 5: Commit**

```bash
cd /tmp/iron-gavel-deploy && git add server/src/routes/contacts.router.ts server/src/routes/contacts.test.ts server/src/routes/index.ts
git commit -m "feat: add contacts CRUD with validation and audit logging"
```

---

### Task 4: Tasks CRUD router (matter-scoped)

**Files:**
- Create: `server/src/routes/tasks.router.ts`
- Create: `server/src/routes/tasks.test.ts`
- Modify: `server/src/routes/index.ts`

- [ ] **Step 1: Write the failing tests**

Create `server/src/routes/tasks.test.ts`:

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { prisma } from '../lib/prisma.js';
import { generateAccessToken } from '../auth/auth.service.js';

const token = generateAccessToken({ userId: 'USER_1', role: 'Admin' });
let matterId: string;
let createdTaskId: string;

beforeAll(async () => {
  await prisma.user.upsert({
    where: { id: 'USER_1' },
    update: {},
    create: { id: 'USER_1', email: 'task-admin@test.com', passwordHash: 'x', name: 'Admin', role: 'Admin' },
  });
  const m = await prisma.matter.create({
    data: { name: 'Task Test Matter', client: 'Test', status: 'Open', openDate: new Date(), billingType: 'Hourly', permissions: 'Firm' },
  });
  matterId = m.id;
});

afterAll(async () => {
  await prisma.task.deleteMany({ where: { matterId } });
  await prisma.matter.deleteMany({ where: { id: matterId } });
  await prisma.$disconnect();
});

describe('Tasks CRUD', () => {
  it('POST /api/v1/tasks — creates a task', async () => {
    const res = await request(app)
      .post('/api/v1/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({
        matterId,
        description: 'File motion',
        dueDate: '2026-04-15',
        priority: 'High',
      });

    expect(res.status).toBe(201);
    expect(res.body.description).toBe('File motion');
    createdTaskId = res.body.id;
  });

  it('GET /api/v1/tasks?matterId= — lists tasks for a matter', async () => {
    const res = await request(app)
      .get(`/api/v1/tasks?matterId=${matterId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('GET /api/v1/tasks/:id — gets a single task', async () => {
    const res = await request(app)
      .get(`/api/v1/tasks/${createdTaskId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.description).toBe('File motion');
  });

  it('PUT /api/v1/tasks/:id — updates a task', async () => {
    const res = await request(app)
      .put(`/api/v1/tasks/${createdTaskId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ completed: true });

    expect(res.status).toBe(200);
    expect(res.body.completed).toBe(true);
  });

  it('DELETE /api/v1/tasks/:id — deletes a task', async () => {
    const res = await request(app)
      .delete(`/api/v1/tasks/${createdTaskId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
  });
});
```

- [ ] **Step 2: Implement tasks router**

Create `server/src/routes/tasks.router.ts`:

```typescript
import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { auditLog } from '../middleware/auditLog.js';

export const tasksRouter = Router();

const staff = [authenticate, authorize('Admin', 'Attorney', 'Paralegal')];

const createSchema = z.object({
  matterId: z.string().min(1),
  description: z.string().min(1),
  notes: z.string().optional(),
  dueDate: z.string(),
  priority: z.enum(['High', 'Medium', 'Low']).default('Medium'),
  recurrence: z.string().optional(),
  assignedUserId: z.string().optional(),
  assignedByUserId: z.string().optional(),
});

const updateSchema = z.object({
  description: z.string().optional(),
  notes: z.string().optional(),
  dueDate: z.string().optional(),
  completed: z.boolean().optional(),
  priority: z.enum(['High', 'Medium', 'Low']).optional(),
  assignedUserId: z.string().optional(),
});

tasksRouter.get('/', ...staff, async (req, res) => {
  const where = req.query.matterId ? { matterId: String(req.query.matterId) } : {};
  const tasks = await prisma.task.findMany({ where, orderBy: { dueDate: 'asc' }, include: { matter: { select: { name: true } } } });
  res.json(tasks);
});

tasksRouter.get('/:id', ...staff, async (req, res) => {
  const task = await prisma.task.findUnique({ where: { id: req.params.id }, include: { matter: { select: { name: true } } } });
  if (!task) { res.status(404).json({ error: 'Task not found' }); return; }
  res.json(task);
});

tasksRouter.post('/', ...staff, auditLog('CREATE', 'Task'), async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() }); return; }
  const { dueDate, ...rest } = parsed.data;
  const task = await prisma.task.create({ data: { ...rest, dueDate: new Date(dueDate) } });
  res.status(201).json(task);
});

tasksRouter.put('/:id', ...staff, auditLog('UPDATE', 'Task'), async (req, res) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() }); return; }
  const existing = await prisma.task.findUnique({ where: { id: req.params.id } });
  if (!existing) { res.status(404).json({ error: 'Task not found' }); return; }
  const { dueDate, ...rest } = parsed.data;
  const task = await prisma.task.update({ where: { id: req.params.id }, data: { ...rest, ...(dueDate ? { dueDate: new Date(dueDate) } : {}) } });
  res.json(task);
});

tasksRouter.delete('/:id', ...staff, auditLog('DELETE', 'Task'), async (req, res) => {
  const existing = await prisma.task.findUnique({ where: { id: req.params.id } });
  if (!existing) { res.status(404).json({ error: 'Task not found' }); return; }
  await prisma.task.delete({ where: { id: req.params.id } });
  res.json({ message: 'Task deleted' });
});
```

- [ ] **Step 3: Add to route index**

Add to `server/src/routes/index.ts`:

```typescript
import { tasksRouter } from './tasks.router.js';
// ... existing imports
apiRouter.use('/tasks', tasksRouter);
```

- [ ] **Step 4: Run tests inside Docker**

Expected: 5 tests PASS.

- [ ] **Step 5: Commit**

```bash
cd /tmp/iron-gavel-deploy && git add server/src/routes/tasks.router.ts server/src/routes/tasks.test.ts server/src/routes/index.ts
git commit -m "feat: add tasks CRUD with matter scoping"
```

---

### Task 5: Events and Communications CRUD routers

**Files:**
- Create: `server/src/routes/events.router.ts`
- Create: `server/src/routes/events.test.ts`
- Create: `server/src/routes/communications.router.ts`
- Create: `server/src/routes/communications.test.ts`
- Modify: `server/src/routes/index.ts`

- [ ] **Step 1: Write events test**

Create `server/src/routes/events.test.ts`:

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { prisma } from '../lib/prisma.js';
import { generateAccessToken } from '../auth/auth.service.js';

const token = generateAccessToken({ userId: 'USER_1', role: 'Admin' });
let matterId: string;
let createdEventId: string;

beforeAll(async () => {
  await prisma.user.upsert({
    where: { id: 'USER_1' },
    update: {},
    create: { id: 'USER_1', email: 'event-admin@test.com', passwordHash: 'x', name: 'Admin', role: 'Admin' },
  });
  const m = await prisma.matter.create({
    data: { name: 'Event Test Matter', client: 'Test', status: 'Open', openDate: new Date(), billingType: 'Hourly', permissions: 'Firm' },
  });
  matterId = m.id;
});

afterAll(async () => {
  await prisma.event.deleteMany({ where: { matterId } });
  await prisma.matter.deleteMany({ where: { id: matterId } });
  await prisma.$disconnect();
});

describe('Events CRUD', () => {
  it('POST /api/v1/events — creates an event', async () => {
    const res = await request(app)
      .post('/api/v1/events')
      .set('Authorization', `Bearer ${token}`)
      .send({
        matterId,
        title: 'Court Hearing',
        date: '2026-04-20',
        startTime: '9:00 AM',
        endTime: '10:00 AM',
        type: 'Court Hearing',
        location: 'Courtroom 3B',
      });

    expect(res.status).toBe(201);
    expect(res.body.title).toBe('Court Hearing');
    createdEventId = res.body.id;
  });

  it('GET /api/v1/events?matterId= — lists events', async () => {
    const res = await request(app)
      .get(`/api/v1/events?matterId=${matterId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('PUT /api/v1/events/:id — updates an event', async () => {
    const res = await request(app)
      .put(`/api/v1/events/${createdEventId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ location: 'Courtroom 5A' });

    expect(res.status).toBe(200);
    expect(res.body.location).toBe('Courtroom 5A');
  });

  it('DELETE /api/v1/events/:id — deletes an event', async () => {
    const res = await request(app)
      .delete(`/api/v1/events/${createdEventId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
  });
});
```

- [ ] **Step 2: Implement events router**

Create `server/src/routes/events.router.ts`:

```typescript
import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { auditLog } from '../middleware/auditLog.js';

export const eventsRouter = Router();

const staff = [authenticate, authorize('Admin', 'Attorney', 'Paralegal')];

const createSchema = z.object({
  matterId: z.string().min(1),
  title: z.string().min(1),
  date: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  type: z.string(),
  location: z.string().default(''),
  allDay: z.boolean().default(false),
  description: z.string().optional(),
  recurrence: z.any().optional(),
  attendees: z.array(z.string()).optional(),
  reminders: z.any().optional(),
});

const updateSchema = createSchema.partial();

eventsRouter.get('/', ...staff, async (req, res) => {
  const where = req.query.matterId ? { matterId: String(req.query.matterId) } : {};
  const events = await prisma.event.findMany({ where, orderBy: { date: 'asc' } });
  res.json(events);
});

eventsRouter.get('/:id', ...staff, async (req, res) => {
  const event = await prisma.event.findUnique({ where: { id: req.params.id } });
  if (!event) { res.status(404).json({ error: 'Event not found' }); return; }
  res.json(event);
});

eventsRouter.post('/', ...staff, auditLog('CREATE', 'Event'), async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() }); return; }
  const { date, ...rest } = parsed.data;
  const event = await prisma.event.create({ data: { ...rest, date: new Date(date) } });
  res.status(201).json(event);
});

eventsRouter.put('/:id', ...staff, auditLog('UPDATE', 'Event'), async (req, res) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() }); return; }
  const existing = await prisma.event.findUnique({ where: { id: req.params.id } });
  if (!existing) { res.status(404).json({ error: 'Event not found' }); return; }
  const { date, ...rest } = parsed.data;
  const event = await prisma.event.update({ where: { id: req.params.id }, data: { ...rest, ...(date ? { date: new Date(date) } : {}) } });
  res.json(event);
});

eventsRouter.delete('/:id', ...staff, auditLog('DELETE', 'Event'), async (req, res) => {
  const existing = await prisma.event.findUnique({ where: { id: req.params.id } });
  if (!existing) { res.status(404).json({ error: 'Event not found' }); return; }
  await prisma.event.delete({ where: { id: req.params.id } });
  res.json({ message: 'Event deleted' });
});
```

- [ ] **Step 3: Write communications test**

Create `server/src/routes/communications.test.ts`:

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { prisma } from '../lib/prisma.js';
import { generateAccessToken } from '../auth/auth.service.js';

const token = generateAccessToken({ userId: 'USER_1', role: 'Admin' });
let matterId: string;
let createdId: string;

beforeAll(async () => {
  await prisma.user.upsert({
    where: { id: 'USER_1' },
    update: {},
    create: { id: 'USER_1', email: 'comm-admin@test.com', passwordHash: 'x', name: 'Admin', role: 'Admin' },
  });
  const m = await prisma.matter.create({
    data: { name: 'Comm Test Matter', client: 'Test', status: 'Open', openDate: new Date(), billingType: 'Hourly', permissions: 'Firm' },
  });
  matterId = m.id;
});

afterAll(async () => {
  await prisma.communication.deleteMany({ where: { matterId } });
  await prisma.matter.deleteMany({ where: { id: matterId } });
  await prisma.$disconnect();
});

describe('Communications CRUD', () => {
  it('POST /api/v1/communications — creates a communication', async () => {
    const res = await request(app)
      .post('/api/v1/communications')
      .set('Authorization', `Bearer ${token}`)
      .send({
        matterId,
        type: 'Email',
        subject: 'Case update',
        date: '2026-04-01',
        participants: ['Arthur Dent', 'Christopher Washington'],
        summary: 'Discussed next steps.',
      });

    expect(res.status).toBe(201);
    expect(res.body.subject).toBe('Case update');
    createdId = res.body.id;
  });

  it('GET /api/v1/communications?matterId= — lists communications', async () => {
    const res = await request(app)
      .get(`/api/v1/communications?matterId=${matterId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('DELETE /api/v1/communications/:id — deletes a communication', async () => {
    const res = await request(app)
      .delete(`/api/v1/communications/${createdId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
  });
});
```

- [ ] **Step 4: Implement communications router**

Create `server/src/routes/communications.router.ts`:

```typescript
import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { auditLog } from '../middleware/auditLog.js';

export const communicationsRouter = Router();

const staff = [authenticate, authorize('Admin', 'Attorney', 'Paralegal')];

const createSchema = z.object({
  matterId: z.string().min(1),
  type: z.string(),
  subject: z.string().min(1),
  date: z.string(),
  participants: z.array(z.string()),
  summary: z.string().default(''),
});

const updateSchema = createSchema.partial();

communicationsRouter.get('/', ...staff, async (req, res) => {
  const where = req.query.matterId ? { matterId: String(req.query.matterId) } : {};
  const comms = await prisma.communication.findMany({ where, orderBy: { date: 'desc' } });
  res.json(comms);
});

communicationsRouter.get('/:id', ...staff, async (req, res) => {
  const comm = await prisma.communication.findUnique({ where: { id: req.params.id } });
  if (!comm) { res.status(404).json({ error: 'Communication not found' }); return; }
  res.json(comm);
});

communicationsRouter.post('/', ...staff, auditLog('CREATE', 'Communication'), async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() }); return; }
  const { date, ...rest } = parsed.data;
  const comm = await prisma.communication.create({ data: { ...rest, date: new Date(date) } });
  res.status(201).json(comm);
});

communicationsRouter.put('/:id', ...staff, auditLog('UPDATE', 'Communication'), async (req, res) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() }); return; }
  const existing = await prisma.communication.findUnique({ where: { id: req.params.id } });
  if (!existing) { res.status(404).json({ error: 'Communication not found' }); return; }
  const { date, ...rest } = parsed.data;
  const comm = await prisma.communication.update({ where: { id: req.params.id }, data: { ...rest, ...(date ? { date: new Date(date) } : {}) } });
  res.json(comm);
});

communicationsRouter.delete('/:id', ...staff, auditLog('DELETE', 'Communication'), async (req, res) => {
  const existing = await prisma.communication.findUnique({ where: { id: req.params.id } });
  if (!existing) { res.status(404).json({ error: 'Communication not found' }); return; }
  await prisma.communication.delete({ where: { id: req.params.id } });
  res.json({ message: 'Communication deleted' });
});
```

- [ ] **Step 5: Update route index**

Update `server/src/routes/index.ts`:

```typescript
import { Router } from 'express';
import { mattersRouter } from './matters.router.js';
import { contactsRouter } from './contacts.router.js';
import { tasksRouter } from './tasks.router.js';
import { eventsRouter } from './events.router.js';
import { communicationsRouter } from './communications.router.js';

export const apiRouter = Router();

apiRouter.use('/matters', mattersRouter);
apiRouter.use('/contacts', contactsRouter);
apiRouter.use('/tasks', tasksRouter);
apiRouter.use('/events', eventsRouter);
apiRouter.use('/communications', communicationsRouter);
```

- [ ] **Step 6: Run all tests inside Docker**

Expected: Events 4 PASS, Communications 3 PASS.

- [ ] **Step 7: Commit**

```bash
cd /tmp/iron-gavel-deploy && git add server/src/routes/
git commit -m "feat: add events and communications CRUD routers"
```

---

### Task 6: Run all tests — full validation

**Files:** None — validation only.

- [ ] **Step 1: Run all server tests inside Docker**

```bash
export PATH="/Applications/Docker.app/Contents/Resources/bin:$PATH"
cd /tmp/iron-gavel-deploy
docker run --rm --network iron-gavel-deploy_default \
  -v "$(pwd):/app" -w /app/server \
  -e DATABASE_URL="postgresql://irongavel:irongavel@db:5432/irongavel?schema=public" \
  node:20-alpine sh -c "npx vitest run"
```

Expected totals:
- health.test.ts: 1
- auth.service.test.ts: 5
- auth.test.ts: 9
- authenticate.test.ts: 4
- authorize.test.ts: 4
- matterPermission.test.ts: 7
- auditLog.test.ts: 2
- matters.test.ts: 8
- contacts.test.ts: 6
- tasks.test.ts: 5
- events.test.ts: 4
- communications.test.ts: 3
- **Total: ~58 tests**

- [ ] **Step 2: Commit any fixes if needed**

If validation required changes:
```bash
cd /tmp/iron-gavel-deploy && git add -A && git commit -m "fix: adjustments from CRUD validation"
```
