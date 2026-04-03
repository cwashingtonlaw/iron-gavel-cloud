import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { prisma } from '../lib/prisma.js';
import { generateAccessToken } from '../auth/auth.service.js';

const adminToken = generateAccessToken({ userId: 'USER_DOCS_1', role: 'Admin' });
let createdDocumentId: string;
let testMatterId: string;

beforeAll(async () => {
  await prisma.user.upsert({
    where: { id: 'USER_DOCS_1' },
    update: {},
    create: {
      id: 'USER_DOCS_1',
      email: 'docs-admin@test.com',
      passwordHash: 'x',
      name: 'Docs Admin',
      role: 'Admin',
      defaultRate: 350,
    },
  });

  const matter = await prisma.matter.create({
    data: {
      name: 'Documents Test Matter',
      client: 'Documents Test Client',
      status: 'Open',
      openDate: new Date('2026-01-01'),
      billingType: 'Hourly',
    },
  });
  testMatterId = matter.id;
});

afterAll(async () => {
  if (testMatterId) {
    await prisma.document.deleteMany({ where: { matterId: testMatterId } });
    await prisma.matter.deleteMany({ where: { id: testMatterId } });
  }
  await prisma.$disconnect();
});

describe('Documents CRUD', () => {
  it('POST /api/v1/documents — creates a document record', async () => {
    const res = await request(app)
      .post('/api/v1/documents')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        matterId: testMatterId,
        name: 'Police Report.pdf',
        category: 'Police Reports',
      });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Police Report.pdf');
    expect(res.body.category).toBe('Police Reports');
    expect(res.body.id).toBeDefined();
    createdDocumentId = res.body.id;
  });

  it('GET /api/v1/documents?matterId= — lists documents for a matter', async () => {
    const res = await request(app)
      .get(`/api/v1/documents?matterId=${testMatterId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0].matterId).toBe(testMatterId);
  });

  it('GET /api/v1/documents/:id — gets a single document with versions', async () => {
    const res = await request(app)
      .get(`/api/v1/documents/${createdDocumentId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Police Report.pdf');
    expect(Array.isArray(res.body.versions)).toBe(true);
  });

  it('PUT /api/v1/documents/:id — updates a document (set batesNumber)', async () => {
    const res = await request(app)
      .put(`/api/v1/documents/${createdDocumentId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ batesNumber: 'DEF-001234' });

    expect(res.status).toBe(200);
    expect(res.body.batesNumber).toBe('DEF-001234');
  });

  it('DELETE /api/v1/documents/:id — deletes a document', async () => {
    const res = await request(app)
      .delete(`/api/v1/documents/${createdDocumentId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    createdDocumentId = '';
  });
});
