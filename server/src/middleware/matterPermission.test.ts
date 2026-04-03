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

  const firm = await prisma.matter.create({
    data: { name: 'Firm Matter', client: 'Test', status: 'Open', openDate: new Date(), billingType: 'Hourly', permissions: 'Firm', responsibleAttorneyId: 'PERM_USER_1' },
  });
  firmMatterId = firm.id;

  const priv = await prisma.matter.create({
    data: { name: 'Private Matter', client: 'Test', status: 'Open', openDate: new Date(), billingType: 'Hourly', permissions: 'Private', responsibleAttorneyId: 'PERM_USER_1' },
  });
  privateMatterId = priv.id;

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
