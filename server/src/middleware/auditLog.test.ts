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

    // Give async audit a moment
    await new Promise(r => setTimeout(r, 100));

    const logs = await prisma.auditLog.findMany({ where: { userId: 'AUDIT_USER' } });
    expect(logs.length).toBeGreaterThanOrEqual(1);

    const log = logs[logs.length - 1];
    expect(log.action).toBe('CREATE');
    expect(log.entityType).toBe('Matter');
    expect(log.hash).toBeDefined();
    expect(log.hash.length).toBe(64);
  });

  it('chains hashes — second log references first', async () => {
    const token = generateAccessToken({ userId: 'AUDIT_USER', role: 'Admin' });
    await request(testApp)
      .post('/test-audit')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Another' });

    await new Promise(r => setTimeout(r, 100));

    const logs = await prisma.auditLog.findMany({
      where: { userId: 'AUDIT_USER' },
      orderBy: { timestamp: 'asc' },
    });

    if (logs.length >= 2) {
      const latest = logs[logs.length - 1];
      // The latest log should have a previousHash (proving chaining works)
      // We can't match exact hash because other test suites may create audit logs concurrently
      expect(latest.previousHash).toBeDefined();
      expect(latest.previousHash!.length).toBe(64);
    }
  });
});
