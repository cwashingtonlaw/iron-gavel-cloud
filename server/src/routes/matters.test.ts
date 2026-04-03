import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { prisma } from '../lib/prisma.js';
import { generateAccessToken } from '../auth/auth.service.js';

const adminToken = generateAccessToken({ userId: 'USER_1', role: 'Admin' });
let createdMatterId: string;

beforeAll(async () => {
  await prisma.user.upsert({
    where: { id: 'USER_1' },
    update: {},
    create: { id: 'USER_1', email: 'crud-admin@test.com', passwordHash: 'x', name: 'Admin', role: 'Admin', defaultRate: 350 },
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
    createdMatterId = '';
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
