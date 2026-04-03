import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { prisma } from '../lib/prisma.js';
import { generateAccessToken } from '../auth/auth.service.js';

const adminToken = generateAccessToken({ userId: 'USER_TXN_1', role: 'Admin' });
let createdTransactionId: string;
let testMatterId: string;

beforeAll(async () => {
  await prisma.user.upsert({
    where: { id: 'USER_TXN_1' },
    update: {},
    create: {
      id: 'USER_TXN_1',
      email: 'txn-admin@test.com',
      passwordHash: 'x',
      name: 'Transaction Admin',
      role: 'Admin',
      defaultRate: 350,
    },
  });

  const matter = await prisma.matter.create({
    data: {
      name: 'Transaction Test Matter',
      client: 'Transaction Test Client',
      status: 'Open',
      openDate: new Date('2026-01-01'),
      billingType: 'Hourly',
    },
  });
  testMatterId = matter.id;
});

afterAll(async () => {
  if (createdTransactionId) {
    await prisma.transaction.deleteMany({ where: { id: createdTransactionId } });
  }
  await prisma.transaction.deleteMany({ where: { matterId: testMatterId } });
  if (testMatterId) {
    await prisma.matter.deleteMany({ where: { id: testMatterId } });
  }
  await prisma.$disconnect();
});

describe('Transactions CRUD', () => {
  it('POST /api/v1/transactions — creates a transaction', async () => {
    const res = await request(app)
      .post('/api/v1/transactions')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        matterId: testMatterId,
        date: '2026-04-01',
        type: 'Deposit',
        ledger: 'Operating',
        description: 'Retainer payment',
        amount: 2500,
      });

    expect(res.status).toBe(201);
    expect(res.body.description).toBe('Retainer payment');
    expect(res.body.amount).toBe(2500);
    expect(res.body.type).toBe('Deposit');
    expect(res.body.ledger).toBe('Operating');
    expect(res.body.id).toBeDefined();
    createdTransactionId = res.body.id;
  });

  it('GET /api/v1/transactions?matterId= — lists transactions for a matter', async () => {
    const res = await request(app)
      .get(`/api/v1/transactions?matterId=${testMatterId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0].matterId).toBe(testMatterId);
    expect(res.body[0].matter).toBeDefined();
    expect(res.body[0].matter.name).toBeDefined();
  });

  it('GET /api/v1/transactions/:id — gets a single transaction', async () => {
    const res = await request(app)
      .get(`/api/v1/transactions/${createdTransactionId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.description).toBe('Retainer payment');
    expect(res.body.matter).toBeDefined();
  });

  it('PUT /api/v1/transactions/:id — updates a transaction', async () => {
    const res = await request(app)
      .put(`/api/v1/transactions/${createdTransactionId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ description: 'Updated retainer payment' });

    expect(res.status).toBe(200);
    expect(res.body.description).toBe('Updated retainer payment');
  });

  it('DELETE /api/v1/transactions/:id — deletes a transaction', async () => {
    const res = await request(app)
      .delete(`/api/v1/transactions/${createdTransactionId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    createdTransactionId = '';
  });

  it('GET /api/v1/trust/:matterId/balance — returns correct trust balance', async () => {
    // Create a Deposit of 5000 and a Payment of 1000, expect balance 4000
    await request(app)
      .post('/api/v1/transactions')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        matterId: testMatterId,
        date: '2026-04-01',
        type: 'Deposit',
        ledger: 'Trust',
        description: 'Trust deposit',
        amount: 5000,
      });

    await request(app)
      .post('/api/v1/transactions')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        matterId: testMatterId,
        date: '2026-04-01',
        type: 'Payment',
        ledger: 'Trust',
        description: 'Trust payment',
        amount: 1000,
      });

    const res = await request(app)
      .get(`/api/v1/trust/${testMatterId}/balance`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.matterId).toBe(testMatterId);
    expect(res.body.balance).toBe(4000);
  });
});
