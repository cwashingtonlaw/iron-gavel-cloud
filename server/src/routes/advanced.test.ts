import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { prisma } from '../lib/prisma.js';
import { generateAccessToken } from '../auth/auth.service.js';
import * as OTPAuth from 'otpauth';

const adminToken = generateAccessToken({ userId: 'ADV_USER', role: 'Admin' });
const staffToken = generateAccessToken({ userId: 'ADV_STAFF', role: 'Attorney' });

beforeAll(async () => {
  await prisma.user.upsert({ where: { id: 'ADV_USER' }, update: {}, create: { id: 'ADV_USER', email: 'adv-admin@test.com', passwordHash: 'x', name: 'Adv Admin', role: 'Admin' } });
  await prisma.user.upsert({ where: { id: 'ADV_STAFF' }, update: {}, create: { id: 'ADV_STAFF', email: 'adv-staff@test.com', passwordHash: 'x', name: 'Adv Staff', role: 'Attorney' } });
  // Create searchable data
  await prisma.matter.create({ data: { id: 'SEARCH_MAT', name: 'Searchable Vogon Case', client: 'Arthur Dent', status: 'Open', openDate: new Date(), billingType: 'Hourly', permissions: 'Firm' } });
});

afterAll(async () => {
  await prisma.twoFactorAuth.deleteMany({ where: { userId: 'ADV_USER' } });
  await prisma.matter.deleteMany({ where: { id: 'SEARCH_MAT' } });
  await prisma.user.deleteMany({ where: { id: { in: ['ADV_USER', 'ADV_STAFF'] } } });
  await prisma.$disconnect();
});

describe('2FA', () => {
  let secret: string;

  it('POST /auth/2fa/setup returns secret', async () => {
    const res = await request(app).post('/api/v1/auth/2fa/setup').set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.secret).toBeDefined();
    expect(res.body.otpauthUrl).toContain('otpauth://');
    secret = res.body.secret;
  });

  it('POST /auth/2fa/verify with valid code enables 2FA', async () => {
    const totp = new OTPAuth.TOTP({
      issuer: 'Iron Gavel',
      label: 'ADV_USER',
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: OTPAuth.Secret.fromBase32(secret),
    });
    const code = totp.generate();

    const res = await request(app).post('/api/v1/auth/2fa/verify').set('Authorization', `Bearer ${adminToken}`).send({ code });
    expect(res.status).toBe(200);
    expect(res.body.enabled).toBe(true);
  });
});

describe('Search', () => {
  it('GET /search?q= returns results', async () => {
    const res = await request(app).get('/api/v1/search?q=Vogon').set('Authorization', `Bearer ${staffToken}`);
    expect(res.status).toBe(200);
    expect(res.body.total).toBeGreaterThan(0);
    expect(res.body.matters.length).toBeGreaterThan(0);
  });

  it('GET /search rejects empty query', async () => {
    const res = await request(app).get('/api/v1/search').set('Authorization', `Bearer ${staffToken}`);
    expect(res.status).toBe(400);
  });
});

describe('Admin', () => {
  it('GET /admin/backups returns array', async () => {
    const res = await request(app).get('/api/v1/admin/backups').set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('non-admin cannot access admin routes', async () => {
    const res = await request(app).get('/api/v1/admin/backups').set('Authorization', `Bearer ${staffToken}`);
    expect(res.status).toBe(403);
  });
});
