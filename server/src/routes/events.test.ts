import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { prisma } from '../lib/prisma.js';
import { generateAccessToken } from '../auth/auth.service.js';

const adminToken = generateAccessToken({ userId: 'USER_EVENTS_1', role: 'Admin' });
let createdEventId: string;
let testMatterId: string;

beforeAll(async () => {
  await prisma.user.upsert({
    where: { id: 'USER_EVENTS_1' },
    update: {},
    create: {
      id: 'USER_EVENTS_1',
      email: 'events-admin@test.com',
      passwordHash: 'x',
      name: 'Events Admin',
      role: 'Admin',
      defaultRate: 350,
    },
  });

  const matter = await prisma.matter.create({
    data: {
      name: 'Events Test Matter',
      client: 'Events Test Client',
      status: 'Open',
      openDate: new Date('2026-01-01'),
      billingType: 'Hourly',
    },
  });
  testMatterId = matter.id;
});

afterAll(async () => {
  await prisma.event.deleteMany({ where: { matterId: testMatterId } });
  if (testMatterId) {
    await prisma.matter.deleteMany({ where: { id: testMatterId } });
  }
  await prisma.$disconnect();
});

describe('Events CRUD', () => {
  it('POST /api/v1/events — creates an event', async () => {
    const res = await request(app)
      .post('/api/v1/events')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        matterId: testMatterId,
        title: 'Arraignment Hearing',
        date: '2026-05-15',
        startTime: '09:00',
        endTime: '10:00',
        type: 'Hearing',
        location: 'Courtroom 3B',
        allDay: false,
        description: 'Initial arraignment',
      });

    expect(res.status).toBe(201);
    expect(res.body.title).toBe('Arraignment Hearing');
    expect(res.body.id).toBeDefined();
    createdEventId = res.body.id;
  });

  it('GET /api/v1/events?matterId= — lists events for a matter', async () => {
    const res = await request(app)
      .get(`/api/v1/events?matterId=${testMatterId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0].matterId).toBe(testMatterId);
  });

  it('PUT /api/v1/events/:id — updates an event', async () => {
    const res = await request(app)
      .put(`/api/v1/events/${createdEventId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ location: 'Courtroom 5A', description: 'Rescheduled arraignment' });

    expect(res.status).toBe(200);
    expect(res.body.location).toBe('Courtroom 5A');
    expect(res.body.description).toBe('Rescheduled arraignment');
  });

  it('DELETE /api/v1/events/:id — deletes an event', async () => {
    const res = await request(app)
      .delete(`/api/v1/events/${createdEventId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    createdEventId = '';
  });
});
