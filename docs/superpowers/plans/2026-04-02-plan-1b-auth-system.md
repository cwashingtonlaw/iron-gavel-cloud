# Plan 1B: Authentication System

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add JWT authentication with refresh tokens, bcrypt password hashing, role-based authorization middleware, and matter-level permission enforcement to the Express API.

**Architecture:** Stateless JWT access tokens (15 min) + database-backed refresh tokens (7 days) stored as httpOnly cookies. Middleware chain: authenticate → authorize role → check matter permissions. All auth logic in `server/src/auth/`, all middleware in `server/src/middleware/`.

**Tech Stack:** bcrypt, jsonwebtoken, cookie-parser, Prisma (existing), Zod (existing), vitest + supertest (existing)

---

## File Structure

```
server/src/
├── auth/
│   ├── auth.router.ts        — POST /auth/register, login, refresh, logout
│   ├── auth.service.ts       — hashPassword, verifyPassword, generateTokens, verifyToken
│   └── auth.test.ts          — Integration tests for all auth endpoints
├── middleware/
│   ├── authenticate.ts       — Verify JWT, attach req.user
│   ├── authorize.ts          — Role-based access control
│   ├── matterPermission.ts   — Matter-level permission check
│   ├── authenticate.test.ts  — Unit tests for JWT middleware
│   └── authorize.test.ts     — Unit tests for role middleware
├── lib/
│   └── prisma.ts             — Shared PrismaClient singleton
├── app.ts                    — (modify) Mount auth router, add cookie-parser
└── index.ts                  — (existing, no changes)
```

---

### Task 1: Install auth dependencies and create Prisma singleton

**Files:**
- Modify: `server/package.json`
- Create: `server/src/lib/prisma.ts`

- [ ] **Step 1: Install dependencies**

```bash
cd /tmp/iron-gavel-deploy && npm install bcrypt jsonwebtoken cookie-parser --workspace=@iron-gavel/server && npm install @types/bcrypt @types/jsonwebtoken @types/cookie-parser --save-dev --workspace=@iron-gavel/server
```

- [ ] **Step 2: Create the Prisma singleton**

Create `server/src/lib/prisma.ts`:

```typescript
import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();
```

- [ ] **Step 3: Commit**

```bash
cd /tmp/iron-gavel-deploy && git add server/package.json package-lock.json server/src/lib/prisma.ts
git commit -m "chore: install auth dependencies and create Prisma singleton"
```

---

### Task 2: Auth service — password hashing and JWT tokens

**Files:**
- Create: `server/src/auth/auth.service.ts`
- Create: `server/src/auth/auth.service.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `server/src/auth/auth.service.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword, generateAccessToken, generateRefreshToken, verifyAccessToken } from './auth.service.js';

describe('auth.service', () => {
  describe('password hashing', () => {
    it('hashes a password and verifies it', async () => {
      const hash = await hashPassword('mypassword');
      expect(hash).not.toBe('mypassword');
      expect(await verifyPassword('mypassword', hash)).toBe(true);
    });

    it('rejects wrong password', async () => {
      const hash = await hashPassword('mypassword');
      expect(await verifyPassword('wrongpassword', hash)).toBe(false);
    });
  });

  describe('JWT tokens', () => {
    it('generates and verifies an access token', () => {
      const token = generateAccessToken({ userId: 'USER_1', role: 'Admin' });
      const payload = verifyAccessToken(token);
      expect(payload.userId).toBe('USER_1');
      expect(payload.role).toBe('Admin');
    });

    it('generates a refresh token', () => {
      const token = generateRefreshToken({ userId: 'USER_1', sessionId: 'sess_1' });
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);
    });

    it('rejects an invalid access token', () => {
      expect(() => verifyAccessToken('invalid.token.here')).toThrow();
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd /tmp/iron-gavel-deploy/server && npx vitest run src/auth/auth.service.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement auth service**

Create `server/src/auth/auth.service.ts`:

```typescript
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const SALT_ROUNDS = 12;
const ACCESS_TOKEN_SECRET = process.env.JWT_ACCESS_SECRET ?? 'dev-access-secret-change-in-production';
const REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_SECRET ?? 'dev-refresh-secret-change-in-production';
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';

export interface AccessTokenPayload {
  userId: string;
  role: string;
}

export interface RefreshTokenPayload {
  userId: string;
  sessionId: string;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, ACCESS_TOKEN_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
}

export function generateRefreshToken(payload: RefreshTokenPayload): string {
  return jwt.sign(payload, REFRESH_TOKEN_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRY });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, ACCESS_TOKEN_SECRET) as AccessTokenPayload;
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  return jwt.verify(token, REFRESH_TOKEN_SECRET) as RefreshTokenPayload;
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd /tmp/iron-gavel-deploy/server && npx vitest run src/auth/auth.service.test.ts
```

Expected: 4 tests PASS.

- [ ] **Step 5: Commit**

```bash
cd /tmp/iron-gavel-deploy && git add server/src/auth/
git commit -m "feat: add auth service with bcrypt hashing and JWT tokens"
```

---

### Task 3: Auth router — register, login, refresh, logout

**Files:**
- Create: `server/src/auth/auth.router.ts`
- Create: `server/src/auth/auth.test.ts`
- Modify: `server/src/app.ts`

- [ ] **Step 1: Write the failing tests**

Create `server/src/auth/auth.test.ts`:

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { prisma } from '../lib/prisma.js';

beforeAll(async () => {
  // Clean up test users
  await prisma.user.deleteMany({ where: { email: { startsWith: 'test-auth' } } });
});

afterAll(async () => {
  await prisma.user.deleteMany({ where: { email: { startsWith: 'test-auth' } } });
  await prisma.$disconnect();
});

describe('POST /api/v1/auth/register', () => {
  it('creates a new user and returns tokens', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'test-auth-register@example.com',
        password: 'password123',
        name: 'Test User',
        role: 'Attorney',
      });

    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe('test-auth-register@example.com');
    expect(res.body.user.role).toBe('Attorney');
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.user.passwordHash).toBeUndefined();
    // Refresh token in httpOnly cookie
    expect(res.headers['set-cookie']).toBeDefined();
  });

  it('rejects duplicate email', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'test-auth-register@example.com',
        password: 'password123',
        name: 'Duplicate User',
        role: 'Attorney',
      });

    expect(res.status).toBe(409);
  });

  it('rejects invalid input', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'bad', password: '123' });

    expect(res.status).toBe(400);
  });
});

describe('POST /api/v1/auth/login', () => {
  it('returns tokens for valid credentials', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'test-auth-register@example.com',
        password: 'password123',
      });

    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.user.email).toBe('test-auth-register@example.com');
  });

  it('rejects wrong password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'test-auth-register@example.com',
        password: 'wrongpassword',
      });

    expect(res.status).toBe(401);
  });

  it('rejects nonexistent user', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'nobody@example.com',
        password: 'password123',
      });

    expect(res.status).toBe(401);
  });
});

describe('POST /api/v1/auth/refresh', () => {
  it('returns new access token with valid refresh cookie', async () => {
    // Login first to get refresh cookie
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'test-auth-register@example.com',
        password: 'password123',
      });

    const cookies = loginRes.headers['set-cookie'];

    const res = await request(app)
      .post('/api/v1/auth/refresh')
      .set('Cookie', cookies);

    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeDefined();
  });

  it('rejects request without refresh cookie', async () => {
    const res = await request(app).post('/api/v1/auth/refresh');
    expect(res.status).toBe(401);
  });
});

describe('POST /api/v1/auth/logout', () => {
  it('clears the refresh cookie and deletes session', async () => {
    // Login first
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'test-auth-register@example.com',
        password: 'password123',
      });

    const cookies = loginRes.headers['set-cookie'];
    const token = loginRes.body.accessToken;

    const res = await request(app)
      .post('/api/v1/auth/logout')
      .set('Cookie', cookies)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    // Cookie should be cleared
    const setCookie = res.headers['set-cookie']?.[0] ?? '';
    expect(setCookie).toContain('refreshToken=;');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd /tmp/iron-gavel-deploy/server && DATABASE_URL="postgresql://irongavel:irongavel@localhost:5432/irongavel?schema=public" npx vitest run src/auth/auth.test.ts
```

Note: These tests require a running PostgreSQL. Start it with `docker compose up db -d` from the repo root if not already running.

Expected: FAIL — auth router not found.

- [ ] **Step 3: Implement the auth router**

Create `server/src/auth/auth.router.ts`:

```typescript
import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import {
  hashPassword,
  verifyPassword,
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from './auth.service.js';

export const authRouter = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
  role: z.enum(['Admin', 'Attorney', 'Paralegal', 'Client']).default('Attorney'),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/api/v1/auth',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

authRouter.post('/register', async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
    return;
  }

  const { email, password, name, role } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    res.status(409).json({ error: 'Email already registered' });
    return;
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: { email, passwordHash, name, role },
  });

  const session = await prisma.session.create({
    data: {
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    },
  });

  const accessToken = generateAccessToken({ userId: user.id, role: user.role });
  const refreshToken = generateRefreshToken({ userId: user.id, sessionId: session.id });

  res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);
  res.status(201).json({
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
    accessToken,
  });
});

authRouter.post('/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation failed' });
    return;
  }

  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  const session = await prisma.session.create({
    data: {
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    },
  });

  const accessToken = generateAccessToken({ userId: user.id, role: user.role });
  const refreshToken = generateRefreshToken({ userId: user.id, sessionId: session.id });

  res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);
  res.json({
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
    accessToken,
  });
});

authRouter.post('/refresh', async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (!token) {
    res.status(401).json({ error: 'No refresh token' });
    return;
  }

  try {
    const payload = verifyRefreshToken(token);
    const session = await prisma.session.findUnique({ where: { id: payload.sessionId } });

    if (!session || session.expiresAt < new Date()) {
      res.status(401).json({ error: 'Session expired' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) {
      res.status(401).json({ error: 'User not found' });
      return;
    }

    const accessToken = generateAccessToken({ userId: user.id, role: user.role });
    res.json({ accessToken });
  } catch {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

authRouter.post('/logout', async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (token) {
    try {
      const payload = verifyRefreshToken(token);
      await prisma.session.delete({ where: { id: payload.sessionId } }).catch(() => {});
    } catch {
      // Invalid token — still clear cookie
    }
  }

  res.clearCookie('refreshToken', { path: '/api/v1/auth' });
  res.json({ message: 'Logged out' });
});
```

- [ ] **Step 4: Mount the auth router and add cookie-parser to app.ts**

Replace `server/src/app.ts` with:

```typescript
import express from 'express';
import cookieParser from 'cookie-parser';
import { authRouter } from './auth/auth.router.js';

export const app = express();

app.use(express.json());
app.use(cookieParser());

app.get('/api/v1/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/v1/auth', authRouter);
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
cd /tmp/iron-gavel-deploy/server && DATABASE_URL="postgresql://irongavel:irongavel@localhost:5432/irongavel?schema=public" npx vitest run src/auth/auth.test.ts
```

Expected: All 8 tests PASS.

- [ ] **Step 6: Verify health test still passes**

```bash
cd /tmp/iron-gavel-deploy/server && npx vitest run src/health.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
cd /tmp/iron-gavel-deploy && git add server/src/auth/auth.router.ts server/src/auth/auth.test.ts server/src/app.ts
git commit -m "feat: add auth endpoints — register, login, refresh, logout"
```

---

### Task 4: Authenticate middleware — verify JWT on protected routes

**Files:**
- Create: `server/src/middleware/authenticate.ts`
- Create: `server/src/middleware/authenticate.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `server/src/middleware/authenticate.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import express from 'express';
import { authenticate } from './authenticate.js';
import { generateAccessToken } from '../auth/auth.service.js';

function createTestApp() {
  const app = express();
  app.use(express.json());
  app.get('/protected', authenticate, (req, res) => {
    res.json({ userId: req.user!.userId, role: req.user!.role });
  });
  return app;
}

describe('authenticate middleware', () => {
  const testApp = createTestApp();

  it('passes with valid Bearer token', async () => {
    const token = generateAccessToken({ userId: 'USER_1', role: 'Admin' });
    const res = await request(testApp)
      .get('/protected')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.userId).toBe('USER_1');
    expect(res.body.role).toBe('Admin');
  });

  it('rejects request without Authorization header', async () => {
    const res = await request(testApp).get('/protected');
    expect(res.status).toBe(401);
  });

  it('rejects invalid token', async () => {
    const res = await request(testApp)
      .get('/protected')
      .set('Authorization', 'Bearer invalid.token');

    expect(res.status).toBe(401);
  });

  it('rejects expired token', async () => {
    // Generate a token that expires immediately
    const jwt = await import('jsonwebtoken');
    const token = jwt.default.sign(
      { userId: 'USER_1', role: 'Admin' },
      process.env.JWT_ACCESS_SECRET ?? 'dev-access-secret-change-in-production',
      { expiresIn: '0s' }
    );

    const res = await request(testApp)
      .get('/protected')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(401);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd /tmp/iron-gavel-deploy/server && npx vitest run src/middleware/authenticate.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement authenticate middleware**

Create `server/src/middleware/authenticate.ts`:

```typescript
import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, AccessTokenPayload } from '../auth/auth.service.js';

declare global {
  namespace Express {
    interface Request {
      user?: AccessTokenPayload;
    }
  }
}

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const token = header.slice(7);
  try {
    req.user = verifyAccessToken(token);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd /tmp/iron-gavel-deploy/server && npx vitest run src/middleware/authenticate.test.ts
```

Expected: 4 tests PASS.

- [ ] **Step 5: Commit**

```bash
cd /tmp/iron-gavel-deploy && git add server/src/middleware/
git commit -m "feat: add JWT authenticate middleware"
```

---

### Task 5: Authorize middleware — role-based access control

**Files:**
- Create: `server/src/middleware/authorize.ts`
- Create: `server/src/middleware/authorize.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `server/src/middleware/authorize.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import express from 'express';
import { authenticate } from './authenticate.js';
import { authorize } from './authorize.js';
import { generateAccessToken } from '../auth/auth.service.js';

function createTestApp() {
  const app = express();
  app.use(express.json());
  app.get('/admin-only', authenticate, authorize('Admin'), (_req, res) => {
    res.json({ ok: true });
  });
  app.get('/staff', authenticate, authorize('Admin', 'Attorney', 'Paralegal'), (_req, res) => {
    res.json({ ok: true });
  });
  return app;
}

describe('authorize middleware', () => {
  const testApp = createTestApp();

  it('allows user with required role', async () => {
    const token = generateAccessToken({ userId: 'USER_1', role: 'Admin' });
    const res = await request(testApp)
      .get('/admin-only')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
  });

  it('rejects user without required role', async () => {
    const token = generateAccessToken({ userId: 'USER_3', role: 'Paralegal' });
    const res = await request(testApp)
      .get('/admin-only')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
  });

  it('allows any of multiple roles', async () => {
    const token = generateAccessToken({ userId: 'USER_2', role: 'Attorney' });
    const res = await request(testApp)
      .get('/staff')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
  });

  it('rejects Client from staff route', async () => {
    const token = generateAccessToken({ userId: 'USER_4', role: 'Client' });
    const res = await request(testApp)
      .get('/staff')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd /tmp/iron-gavel-deploy/server && npx vitest run src/middleware/authorize.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement authorize middleware**

Create `server/src/middleware/authorize.ts`:

```typescript
import { Request, Response, NextFunction } from 'express';

export function authorize(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }

    next();
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd /tmp/iron-gavel-deploy/server && npx vitest run src/middleware/authorize.test.ts
```

Expected: 4 tests PASS.

- [ ] **Step 5: Commit**

```bash
cd /tmp/iron-gavel-deploy && git add server/src/middleware/authorize.ts server/src/middleware/authorize.test.ts
git commit -m "feat: add role-based authorize middleware"
```

---

### Task 6: Matter permission middleware

**Files:**
- Create: `server/src/middleware/matterPermission.ts`
- Create: `server/src/middleware/matterPermission.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `server/src/middleware/matterPermission.test.ts`:

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import { authenticate } from './authenticate.js';
import { checkMatterPermission } from './matterPermission.js';
import { generateAccessToken } from '../auth/auth.service.js';
import { prisma } from '../lib/prisma.js';

let firmMatterId: string;
let privateMatterId: string;
let selectiveMatterId: string;

beforeAll(async () => {
  // Create test user if not exists
  await prisma.user.upsert({
    where: { id: 'PERM_USER_1' },
    update: {},
    create: { id: 'PERM_USER_1', email: 'perm-test-1@test.com', passwordHash: 'x', name: 'Perm Test 1', role: 'Attorney' },
  });
  await prisma.user.upsert({
    where: { id: 'PERM_USER_2' },
    update: {},
    create: { id: 'PERM_USER_2', email: 'perm-test-2@test.com', passwordHash: 'x', name: 'Perm Test 2', role: 'Attorney' },
  });

  // Firm-wide matter
  const firm = await prisma.matter.create({
    data: { name: 'Firm Matter', client: 'Test', status: 'Open', openDate: new Date(), billingType: 'Hourly', permissions: 'Firm', responsibleAttorneyId: 'PERM_USER_1' },
  });
  firmMatterId = firm.id;

  // Private matter — only responsible attorney
  const priv = await prisma.matter.create({
    data: { name: 'Private Matter', client: 'Test', status: 'Open', openDate: new Date(), billingType: 'Hourly', permissions: 'Private', responsibleAttorneyId: 'PERM_USER_1' },
  });
  privateMatterId = priv.id;

  // Selective matter — only allowed users
  const sel = await prisma.matter.create({
    data: { name: 'Selective Matter', client: 'Test', status: 'Open', openDate: new Date(), billingType: 'Hourly', permissions: 'Selective', responsibleAttorneyId: 'PERM_USER_1' },
  });
  selectiveMatterId = sel.id;
  await prisma.matterAccess.create({ data: { matterId: sel.id, userId: 'PERM_USER_1' } });
});

afterAll(async () => {
  await prisma.matterAccess.deleteMany({ where: { userId: { startsWith: 'PERM_USER' } } });
  await prisma.matter.deleteMany({ where: { client: 'Test' } });
  await prisma.user.deleteMany({ where: { id: { startsWith: 'PERM_USER' } } });
  await prisma.$disconnect();
});

function createTestApp() {
  const app = express();
  app.use(express.json());
  app.get('/matters/:matterId', authenticate, checkMatterPermission, (_req, res) => {
    res.json({ ok: true });
  });
  return app;
}

describe('checkMatterPermission middleware', () => {
  const testApp = createTestApp();

  it('allows access to Firm-permission matter for any staff', async () => {
    const token = generateAccessToken({ userId: 'PERM_USER_2', role: 'Attorney' });
    const res = await request(testApp)
      .get(`/matters/${firmMatterId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
  });

  it('allows responsible attorney to access Private matter', async () => {
    const token = generateAccessToken({ userId: 'PERM_USER_1', role: 'Attorney' });
    const res = await request(testApp)
      .get(`/matters/${privateMatterId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
  });

  it('denies other attorneys from Private matter', async () => {
    const token = generateAccessToken({ userId: 'PERM_USER_2', role: 'Attorney' });
    const res = await request(testApp)
      .get(`/matters/${privateMatterId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
  });

  it('allows listed user to access Selective matter', async () => {
    const token = generateAccessToken({ userId: 'PERM_USER_1', role: 'Attorney' });
    const res = await request(testApp)
      .get(`/matters/${selectiveMatterId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
  });

  it('denies unlisted user from Selective matter', async () => {
    const token = generateAccessToken({ userId: 'PERM_USER_2', role: 'Attorney' });
    const res = await request(testApp)
      .get(`/matters/${selectiveMatterId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
  });

  it('allows Admin to access any matter', async () => {
    const token = generateAccessToken({ userId: 'PERM_USER_2', role: 'Admin' });
    const res = await request(testApp)
      .get(`/matters/${privateMatterId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
  });

  it('returns 404 for nonexistent matter', async () => {
    const token = generateAccessToken({ userId: 'PERM_USER_1', role: 'Attorney' });
    const res = await request(testApp)
      .get('/matters/nonexistent-id')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd /tmp/iron-gavel-deploy/server && DATABASE_URL="postgresql://irongavel:irongavel@localhost:5432/irongavel?schema=public" npx vitest run src/middleware/matterPermission.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement matter permission middleware**

Create `server/src/middleware/matterPermission.ts`:

```typescript
import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma.js';

export async function checkMatterPermission(req: Request, res: Response, next: NextFunction): Promise<void> {
  const { matterId } = req.params;
  if (!matterId) {
    next();
    return;
  }

  const matter = await prisma.matter.findUnique({
    where: { id: matterId },
    select: { permissions: true, responsibleAttorneyId: true },
  });

  if (!matter) {
    res.status(404).json({ error: 'Matter not found' });
    return;
  }

  const userId = req.user!.userId;
  const role = req.user!.role;

  // Admins can access everything
  if (role === 'Admin') {
    next();
    return;
  }

  switch (matter.permissions) {
    case 'Firm':
      next();
      return;

    case 'Private':
      if (matter.responsibleAttorneyId === userId) {
        next();
        return;
      }
      res.status(403).json({ error: 'Access denied — private matter' });
      return;

    case 'Selective': {
      const access = await prisma.matterAccess.findUnique({
        where: { matterId_userId: { matterId, userId } },
      });
      if (access || matter.responsibleAttorneyId === userId) {
        next();
        return;
      }
      res.status(403).json({ error: 'Access denied — not in allowed list' });
      return;
    }
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd /tmp/iron-gavel-deploy/server && DATABASE_URL="postgresql://irongavel:irongavel@localhost:5432/irongavel?schema=public" npx vitest run src/middleware/matterPermission.test.ts
```

Expected: 7 tests PASS.

- [ ] **Step 5: Commit**

```bash
cd /tmp/iron-gavel-deploy && git add server/src/middleware/matterPermission.ts server/src/middleware/matterPermission.test.ts
git commit -m "feat: add matter-level permission middleware"
```

---

### Task 7: Update seed to use bcrypt and add env vars

**Files:**
- Modify: `server/prisma/seed.ts`
- Modify: `server/.env.example`
- Modify: `server/.env`

- [ ] **Step 1: Update seed to use bcrypt**

In `server/prisma/seed.ts`, replace the hashPassword import and function:

Replace:
```typescript
import crypto from 'crypto';
```
with:
```typescript
import bcrypt from 'bcrypt';
```

Replace:
```typescript
function hashPassword(password: string): string {
  // Placeholder — Plan 1B will replace with bcrypt
  return crypto.createHash('sha256').update(password).digest('hex');
}
```
with:
```typescript
async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}
```

Update all `hashPassword()` calls to use `await`:
- `passwordHash: await hashPassword('admin123'),`
- `passwordHash: await hashPassword('attorney123'),`
- `passwordHash: await hashPassword('paralegal123'),`

- [ ] **Step 2: Update .env.example with JWT secrets**

Append to `server/.env.example`:

```
JWT_ACCESS_SECRET=change-this-to-a-random-64-char-string
JWT_REFRESH_SECRET=change-this-to-a-different-random-64-char-string
```

Update `server/.env` similarly (with dev values already set from the auth.service defaults).

- [ ] **Step 3: Commit**

```bash
cd /tmp/iron-gavel-deploy && git add server/prisma/seed.ts server/.env.example
git commit -m "chore: update seed to use bcrypt, document JWT env vars"
```

---

### Task 8: Run all tests and verify full auth flow

**Files:** None — validation only.

- [ ] **Step 1: Run all server tests**

```bash
cd /tmp/iron-gavel-deploy/server && DATABASE_URL="postgresql://irongavel:irongavel@localhost:5432/irongavel?schema=public" npx vitest run
```

Expected: All tests pass — health check (1), auth service (4), auth endpoints (8), authenticate middleware (4), authorize middleware (4), matter permissions (7) = **28 tests**.

- [ ] **Step 2: Manual smoke test**

Start the server and test the auth flow:

```bash
cd /tmp/iron-gavel-deploy/server && DATABASE_URL="postgresql://irongavel:irongavel@localhost:5432/irongavel?schema=public" npx tsx src/index.ts &
sleep 2

# Register
curl -s -X POST http://localhost:4000/api/v1/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"smoke@test.com","password":"password123","name":"Smoke Test","role":"Attorney"}' | jq .

# Login
curl -s -X POST http://localhost:4000/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"smoke@test.com","password":"password123"}' -c /tmp/cookies.txt | jq .

# Health (still works without auth)
curl -s http://localhost:4000/api/v1/health | jq .

kill %1
```

- [ ] **Step 3: Clean up smoke test data**

```bash
cd /tmp/iron-gavel-deploy/server && DATABASE_URL="postgresql://irongavel:irongavel@localhost:5432/irongavel?schema=public" npx tsx -e "
import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
await p.session.deleteMany({ where: { user: { email: 'smoke@test.com' } } });
await p.user.deleteMany({ where: { email: 'smoke@test.com' } });
await p.\$disconnect();
console.log('Cleaned up smoke test data');
"
```

- [ ] **Step 4: Commit if any fixes were needed**

If the validation step required fixes:

```bash
cd /tmp/iron-gavel-deploy && git add -A && git commit -m "fix: adjustments from auth system validation"
```

If no changes, skip.
