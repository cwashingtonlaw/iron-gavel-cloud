import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { prisma } from '../lib/prisma.js';
import { generateAccessToken } from '../auth/auth.service.js';

const adminToken = generateAccessToken({ userId: 'USER_CONTACTS_1', role: 'Admin' });
let createdContactId: string;

beforeAll(async () => {
  await prisma.user.upsert({
    where: { id: 'USER_CONTACTS_1' },
    update: {},
    create: {
      id: 'USER_CONTACTS_1',
      email: 'contacts-admin@test.com',
      passwordHash: 'x',
      name: 'Contacts Admin',
      role: 'Admin',
      defaultRate: 350,
    },
  });
});

afterAll(async () => {
  if (createdContactId) {
    await prisma.contact.deleteMany({ where: { id: createdContactId } });
  }
  await prisma.$disconnect();
});

describe('Contacts CRUD', () => {
  it('POST /api/v1/contacts — creates a contact', async () => {
    const res = await request(app)
      .post('/api/v1/contacts')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Jane Doe',
        type: 'Client',
        email: 'jane@example.com',
        phone: '555-1234',
      });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Jane Doe');
    expect(res.body.id).toBeDefined();
    createdContactId = res.body.id;
  });

  it('GET /api/v1/contacts — lists contacts', async () => {
    const res = await request(app)
      .get('/api/v1/contacts')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('GET /api/v1/contacts/:id — gets a single contact', async () => {
    const res = await request(app)
      .get(`/api/v1/contacts/${createdContactId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Jane Doe');
  });

  it('PUT /api/v1/contacts/:id — updates a contact', async () => {
    const res = await request(app)
      .put(`/api/v1/contacts/${createdContactId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Jane Smith' });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Jane Smith');
  });

  it('DELETE /api/v1/contacts/:id — deletes a contact', async () => {
    const res = await request(app)
      .delete(`/api/v1/contacts/${createdContactId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    createdContactId = '';
  });

  it('POST /api/v1/contacts — rejects invalid type', async () => {
    const res = await request(app)
      .post('/api/v1/contacts')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Bad Contact', type: 'InvalidType' });

    expect(res.status).toBe(400);
  });
});
