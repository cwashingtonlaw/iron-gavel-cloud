import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { prisma } from '../lib/prisma.js';
import { generateAccessToken } from '../auth/auth.service.js';

const adminToken = generateAccessToken({ userId: 'USER_INV_1', role: 'Admin' });
let createdInvoiceId: string;
let testMatterId: string;

beforeAll(async () => {
  await prisma.user.upsert({
    where: { id: 'USER_INV_1' },
    update: {},
    create: {
      id: 'USER_INV_1',
      email: 'inv-admin@test.com',
      passwordHash: 'x',
      name: 'Invoice Admin',
      role: 'Admin',
      defaultRate: 350,
    },
  });

  const matter = await prisma.matter.create({
    data: {
      name: 'Invoice Test Matter',
      client: 'Invoice Test Client',
      status: 'Open',
      openDate: new Date('2026-01-01'),
      billingType: 'Hourly',
    },
  });
  testMatterId = matter.id;
});

afterAll(async () => {
  if (createdInvoiceId) {
    await prisma.invoice.deleteMany({ where: { id: createdInvoiceId } });
  }
  if (testMatterId) {
    await prisma.matter.deleteMany({ where: { id: testMatterId } });
  }
  await prisma.$disconnect();
});

describe('Invoices CRUD', () => {
  it('POST /api/v1/invoices — creates an invoice', async () => {
    const res = await request(app)
      .post('/api/v1/invoices')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        matterId: testMatterId,
        issueDate: '2026-04-01',
        dueDate: '2026-05-01',
        amount: 5000,
        status: 'Unpaid',
        clientName: 'Test Client',
      });

    expect(res.status).toBe(201);
    expect(res.body.amount).toBe(5000);
    expect(res.body.status).toBe('Unpaid');
    expect(res.body.clientName).toBe('Test Client');
    expect(res.body.id).toBeDefined();
    createdInvoiceId = res.body.id;
  });

  it('GET /api/v1/invoices?matterId= — lists invoices for a matter', async () => {
    const res = await request(app)
      .get(`/api/v1/invoices?matterId=${testMatterId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0].matterId).toBe(testMatterId);
    expect(res.body[0].matter).toBeDefined();
    expect(res.body[0].matter.name).toBeDefined();
  });

  it('GET /api/v1/invoices/:id — gets a single invoice', async () => {
    const res = await request(app)
      .get(`/api/v1/invoices/${createdInvoiceId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.amount).toBe(5000);
    expect(res.body.matter).toBeDefined();
  });

  it('PUT /api/v1/invoices/:id — updates an invoice (set status=Paid)', async () => {
    const res = await request(app)
      .put(`/api/v1/invoices/${createdInvoiceId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'Paid' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('Paid');
  });

  it('DELETE /api/v1/invoices/:id — deletes an invoice', async () => {
    const res = await request(app)
      .delete(`/api/v1/invoices/${createdInvoiceId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    createdInvoiceId = '';
  });
});
