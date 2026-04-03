import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { prisma } from '../lib/prisma.js';
import { generateAccessToken } from '../auth/auth.service.js';

const adminToken = generateAccessToken({ userId: 'USER_COMMS_1', role: 'Admin' });
let createdCommId: string;
let testMatterId: string;

beforeAll(async () => {
  await prisma.user.upsert({
    where: { id: 'USER_COMMS_1' },
    update: {},
    create: {
      id: 'USER_COMMS_1',
      email: 'comms-admin@test.com',
      passwordHash: 'x',
      name: 'Comms Admin',
      role: 'Admin',
      defaultRate: 350,
    },
  });

  const matter = await prisma.matter.create({
    data: {
      name: 'Communications Test Matter',
      client: 'Communications Test Client',
      status: 'Open',
      openDate: new Date('2026-01-01'),
      billingType: 'Hourly',
    },
  });
  testMatterId = matter.id;
});

afterAll(async () => {
  await prisma.communication.deleteMany({ where: { matterId: testMatterId } });
  if (testMatterId) {
    await prisma.matter.deleteMany({ where: { id: testMatterId } });
  }
  await prisma.$disconnect();
});

describe('Communications CRUD', () => {
  it('POST /api/v1/communications — creates a communication', async () => {
    const res = await request(app)
      .post('/api/v1/communications')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        matterId: testMatterId,
        type: 'Email',
        subject: 'Discovery request follow-up',
        date: '2026-05-10',
        participants: ['attorney@firm.com', 'client@example.com'],
        summary: 'Followed up on outstanding discovery materials.',
      });

    expect(res.status).toBe(201);
    expect(res.body.subject).toBe('Discovery request follow-up');
    expect(res.body.id).toBeDefined();
    createdCommId = res.body.id;
  });

  it('GET /api/v1/communications?matterId= — lists communications for a matter', async () => {
    const res = await request(app)
      .get(`/api/v1/communications?matterId=${testMatterId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0].matterId).toBe(testMatterId);
  });

  it('DELETE /api/v1/communications/:id — deletes a communication', async () => {
    const res = await request(app)
      .delete(`/api/v1/communications/${createdCommId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    createdCommId = '';
  });
});
