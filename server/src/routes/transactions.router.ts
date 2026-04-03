import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { auditLog } from '../middleware/auditLog.js';

export const transactionsRouter = Router();
export const trustRouter = Router();

const staff = [authenticate, authorize('Admin', 'Attorney', 'Paralegal')];

const createSchema = z.object({
  matterId: z.string().min(1),
  date: z.string(),
  type: z.enum(['Deposit', 'Payment', 'Transfer']),
  ledger: z.enum(['Operating', 'Trust']),
  description: z.string().min(1),
  amount: z.number().positive(),
  fromAccount: z.string().optional(),
  toAccount: z.string().optional(),
});

const updateSchema = z.object({
  matterId: z.string().min(1).optional(),
  date: z.string().optional(),
  type: z.enum(['Deposit', 'Payment', 'Transfer']).optional(),
  ledger: z.enum(['Operating', 'Trust']).optional(),
  description: z.string().min(1).optional(),
  amount: z.number().positive().optional(),
  fromAccount: z.string().optional(),
  toAccount: z.string().optional(),
});

transactionsRouter.get('/', ...staff, async (req, res) => {
  const { matterId } = req.query;
  const transactions = await prisma.transaction.findMany({
    where: matterId ? { matterId: matterId as string } : undefined,
    include: { matter: { select: { name: true } } },
    orderBy: { date: 'desc' },
  });
  res.json(transactions);
});

transactionsRouter.get('/:id', ...staff, async (req, res) => {
  const transaction = await prisma.transaction.findUnique({
    where: { id: req.params.id },
    include: { matter: { select: { name: true } } },
  });
  if (!transaction) {
    res.status(404).json({ error: 'Transaction not found' });
    return;
  }
  res.json(transaction);
});

transactionsRouter.post('/', ...staff, auditLog('CREATE', 'Transaction'), async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
    return;
  }
  const { date, ...rest } = parsed.data;
  const transaction = await prisma.transaction.create({
    data: { ...rest, date: new Date(date) },
  });
  res.status(201).json(transaction);
});

transactionsRouter.put('/:id', ...staff, auditLog('UPDATE', 'Transaction'), async (req, res) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
    return;
  }
  const existing = await prisma.transaction.findUnique({ where: { id: req.params.id } });
  if (!existing) {
    res.status(404).json({ error: 'Transaction not found' });
    return;
  }
  const { date, ...rest } = parsed.data;
  const transaction = await prisma.transaction.update({
    where: { id: req.params.id },
    data: { ...rest, ...(date ? { date: new Date(date) } : {}) },
  });
  res.json(transaction);
});

transactionsRouter.delete('/:id', ...staff, auditLog('DELETE', 'Transaction'), async (req, res) => {
  const existing = await prisma.transaction.findUnique({ where: { id: req.params.id } });
  if (!existing) {
    res.status(404).json({ error: 'Transaction not found' });
    return;
  }
  await prisma.transaction.delete({ where: { id: req.params.id } });
  res.json({ message: 'Transaction deleted' });
});

// POST /trust/reconcile — 3-way IOLTA reconciliation
trustRouter.post('/reconcile', ...staff, async (req, res) => {
  const { matterId, bankBalance } = req.body;
  if (!matterId || bankBalance === undefined) {
    res.status(400).json({ error: 'matterId and bankBalance are required' });
    return;
  }

  const transactions = await prisma.transaction.findMany({
    where: { matterId, ledger: 'Trust' },
  });

  const bookBalance = transactions.reduce((sum, t) => {
    if (t.type === 'Deposit') return sum + t.amount;
    if (t.type === 'Payment') return sum - t.amount;
    return sum;
  }, 0);

  const difference = bankBalance - bookBalance;
  const status = Math.abs(difference) < 0.01 ? 'Balanced' : 'Discrepancy';

  res.json({ matterId, bankBalance, bookBalance, difference, status });
});

// Trust balance endpoint — mounted at /trust/:matterId/balance via trustRouter
trustRouter.get('/:matterId/balance', ...staff, async (req, res) => {
  const transactions = await prisma.transaction.findMany({
    where: { matterId: req.params.matterId, ledger: 'Trust' },
  });

  const balance = transactions.reduce((sum, t) => {
    if (t.type === 'Deposit') return sum + t.amount;
    if (t.type === 'Payment') return sum - t.amount;
    return sum; // Transfer doesn't change balance
  }, 0);

  res.json({ matterId: req.params.matterId, balance });
});
