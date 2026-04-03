import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { prisma } from '../lib/prisma.js';
import { generateAccessToken } from '../auth/auth.service.js';

const token = generateAccessToken({ userId: 'USER_1', role: 'Admin' });
let matterId: string;

beforeAll(async () => {
  await prisma.user.upsert({
    where: { id: 'USER_1' },
    update: {},
    create: { id: 'USER_1', email: 'billing-admin@test.com', passwordHash: 'x', name: 'Admin', role: 'Admin', defaultRate: 350 },
  });

  const m = await prisma.matter.create({
    data: { name: 'Billing Test Matter', client: 'Test Client', status: 'Open', openDate: new Date(), billingType: 'Hourly', permissions: 'Firm' },
  });
  matterId = m.id;
});

afterAll(async () => {
  await prisma.invoice.deleteMany({ where: { matterId } });
  await prisma.timeEntry.deleteMany({ where: { matterId } });
  await prisma.expense.deleteMany({ where: { matterId } });
  await prisma.transaction.deleteMany({ where: { matterId } });
  await prisma.matter.deleteMany({ where: { id: matterId } });
  await prisma.$disconnect();
});

describe('POST /api/v1/invoices/generate — auto-invoice', () => {
  it('generates invoice from unbilled time and expenses', async () => {
    // Create unbilled time entries
    await prisma.timeEntry.createMany({
      data: [
        { matterId, userId: 'USER_1', date: new Date(), description: 'Research', duration: 2, rate: 350 },
        { matterId, userId: 'USER_1', date: new Date(), description: 'Drafting', duration: 1.5, rate: 350 },
      ],
    });

    // Create unbilled expense
    await prisma.expense.create({
      data: { matterId, date: new Date(), description: 'Filing fee', amount: 435, type: 'HardCost' },
    });

    const res = await request(app)
      .post('/api/v1/invoices/generate')
      .set('Authorization', `Bearer ${token}`)
      .send({ matterId });

    expect(res.status).toBe(201);
    // 2*350 + 1.5*350 + 435 = 700 + 525 + 435 = 1660
    expect(res.body.amount).toBe(1660);
    expect(res.body.timeEntries).toBe(2);
    expect(res.body.expenses).toBe(1);
    expect(res.body.status).toBe('Unpaid');

    // Verify entries are now billed
    const unbilledTime = await prisma.timeEntry.findMany({ where: { matterId, isBilled: false } });
    expect(unbilledTime.length).toBe(0);

    const unbilledExpenses = await prisma.expense.findMany({ where: { matterId, isBilled: false } });
    expect(unbilledExpenses.length).toBe(0);
  });

  it('rejects when nothing to invoice', async () => {
    const res = await request(app)
      .post('/api/v1/invoices/generate')
      .set('Authorization', `Bearer ${token}`)
      .send({ matterId });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('No unbilled');
  });
});

describe('POST /api/v1/trust/reconcile — IOLTA reconciliation', () => {
  it('returns Balanced when bank matches book', async () => {
    // Create trust transactions
    await prisma.transaction.createMany({
      data: [
        { matterId, date: new Date(), type: 'Deposit', ledger: 'Trust', description: 'Retainer', amount: 5000 },
        { matterId, date: new Date(), type: 'Payment', ledger: 'Trust', description: 'Filing fee', amount: 1000 },
      ],
    });

    const res = await request(app)
      .post('/api/v1/trust/reconcile')
      .set('Authorization', `Bearer ${token}`)
      .send({ matterId, bankBalance: 4000 });

    expect(res.status).toBe(200);
    expect(res.body.bookBalance).toBe(4000);
    expect(res.body.bankBalance).toBe(4000);
    expect(res.body.difference).toBe(0);
    expect(res.body.status).toBe('Balanced');
  });

  it('returns Discrepancy when bank does not match book', async () => {
    const res = await request(app)
      .post('/api/v1/trust/reconcile')
      .set('Authorization', `Bearer ${token}`)
      .send({ matterId, bankBalance: 3500 });

    expect(res.status).toBe(200);
    expect(res.body.bookBalance).toBe(4000);
    expect(res.body.difference).toBe(-500);
    expect(res.body.status).toBe('Discrepancy');
  });
});
