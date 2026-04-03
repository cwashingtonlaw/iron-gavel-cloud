import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { prisma } from '../lib/prisma.js';
import { generateAccessToken } from '../auth/auth.service.js';

const adminToken = generateAccessToken({ userId: 'USER_EXP_1', role: 'Admin' });
let createdExpenseId: string;
let testMatterId: string;

beforeAll(async () => {
  await prisma.user.upsert({
    where: { id: 'USER_EXP_1' },
    update: {},
    create: {
      id: 'USER_EXP_1',
      email: 'exp-admin@test.com',
      passwordHash: 'x',
      name: 'Expense Admin',
      role: 'Admin',
      defaultRate: 350,
    },
  });

  const matter = await prisma.matter.create({
    data: {
      name: 'Expense Test Matter',
      client: 'Expense Test Client',
      status: 'Open',
      openDate: new Date('2026-01-01'),
      billingType: 'Hourly',
    },
  });
  testMatterId = matter.id;
});

afterAll(async () => {
  if (createdExpenseId) {
    await prisma.expense.deleteMany({ where: { id: createdExpenseId } });
  }
  if (testMatterId) {
    await prisma.matter.deleteMany({ where: { id: testMatterId } });
  }
  await prisma.$disconnect();
});

describe('Expenses CRUD', () => {
  it('POST /api/v1/expenses — creates an expense', async () => {
    const res = await request(app)
      .post('/api/v1/expenses')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        matterId: testMatterId,
        date: '2026-04-01',
        description: 'Expert witness fee',
        amount: 1500,
        type: 'HardCost',
        isBilled: false,
      });

    expect(res.status).toBe(201);
    expect(res.body.description).toBe('Expert witness fee');
    expect(res.body.amount).toBe(1500);
    expect(res.body.type).toBe('HardCost');
    expect(res.body.id).toBeDefined();
    createdExpenseId = res.body.id;
  });

  it('GET /api/v1/expenses?matterId= — lists expenses for a matter', async () => {
    const res = await request(app)
      .get(`/api/v1/expenses?matterId=${testMatterId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0].matterId).toBe(testMatterId);
    expect(res.body[0].matter).toBeDefined();
    expect(res.body[0].matter.name).toBeDefined();
  });

  it('GET /api/v1/expenses/:id — gets a single expense', async () => {
    const res = await request(app)
      .get(`/api/v1/expenses/${createdExpenseId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.description).toBe('Expert witness fee');
    expect(res.body.matter).toBeDefined();
  });

  it('PUT /api/v1/expenses/:id — updates an expense (set isBilled=true)', async () => {
    const res = await request(app)
      .put(`/api/v1/expenses/${createdExpenseId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ isBilled: true });

    expect(res.status).toBe(200);
    expect(res.body.isBilled).toBe(true);
  });

  it('DELETE /api/v1/expenses/:id — deletes an expense', async () => {
    const res = await request(app)
      .delete(`/api/v1/expenses/${createdExpenseId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    createdExpenseId = '';
  });
});
