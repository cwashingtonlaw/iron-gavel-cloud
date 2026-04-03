import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { prisma } from '../lib/prisma.js';
import { generateAccessToken } from '../auth/auth.service.js';

const adminToken = generateAccessToken({ userId: 'USER_TE_1', role: 'Admin' });
let createdEntryId: string;
let testMatterId: string;

beforeAll(async () => {
  await prisma.user.upsert({
    where: { id: 'USER_TE_1' },
    update: {},
    create: {
      id: 'USER_TE_1',
      email: 'te-admin@test.com',
      passwordHash: 'x',
      name: 'Time Entry Admin',
      role: 'Admin',
      defaultRate: 350,
    },
  });

  const matter = await prisma.matter.create({
    data: {
      name: 'Time Entry Test Matter',
      client: 'Time Entry Test Client',
      status: 'Open',
      openDate: new Date('2026-01-01'),
      billingType: 'Hourly',
    },
  });
  testMatterId = matter.id;
});

afterAll(async () => {
  if (createdEntryId) {
    await prisma.timeEntry.deleteMany({ where: { id: createdEntryId } });
  }
  if (testMatterId) {
    await prisma.matter.deleteMany({ where: { id: testMatterId } });
  }
  await prisma.$disconnect();
});

describe('Time Entries CRUD', () => {
  it('POST /api/v1/time-entries — creates a time entry', async () => {
    const res = await request(app)
      .post('/api/v1/time-entries')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        matterId: testMatterId,
        userId: 'USER_TE_1',
        date: '2026-04-01',
        description: 'Drafted motion to suppress',
        duration: 2.5,
        rate: 350,
        isBilled: false,
      });

    expect(res.status).toBe(201);
    expect(res.body.description).toBe('Drafted motion to suppress');
    expect(res.body.duration).toBe(2.5);
    expect(res.body.id).toBeDefined();
    createdEntryId = res.body.id;
  });

  it('GET /api/v1/time-entries?matterId= — lists entries for a matter', async () => {
    const res = await request(app)
      .get(`/api/v1/time-entries?matterId=${testMatterId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0].matterId).toBe(testMatterId);
    expect(res.body[0].matter).toBeDefined();
    expect(res.body[0].matter.name).toBeDefined();
  });

  it('GET /api/v1/time-entries/:id — gets a single time entry', async () => {
    const res = await request(app)
      .get(`/api/v1/time-entries/${createdEntryId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.description).toBe('Drafted motion to suppress');
    expect(res.body.matter).toBeDefined();
  });

  it('PUT /api/v1/time-entries/:id — updates a time entry (set isBilled=true)', async () => {
    const res = await request(app)
      .put(`/api/v1/time-entries/${createdEntryId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ isBilled: true });

    expect(res.status).toBe(200);
    expect(res.body.isBilled).toBe(true);
  });

  it('DELETE /api/v1/time-entries/:id — deletes a time entry', async () => {
    const res = await request(app)
      .delete(`/api/v1/time-entries/${createdEntryId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    createdEntryId = '';
  });
});
