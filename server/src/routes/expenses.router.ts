import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { auditLog } from '../middleware/auditLog.js';

export const expensesRouter = Router();

const staff = [authenticate, authorize('Admin', 'Attorney', 'Paralegal')];

const createSchema = z.object({
  matterId: z.string().min(1),
  date: z.string(),
  description: z.string().min(1),
  amount: z.number(),
  type: z.enum(['HardCost', 'SoftCost']),
  isBilled: z.boolean().default(false),
});

const updateSchema = z.object({
  matterId: z.string().min(1).optional(),
  date: z.string().optional(),
  description: z.string().min(1).optional(),
  amount: z.number().optional(),
  type: z.enum(['HardCost', 'SoftCost']).optional(),
  isBilled: z.boolean().optional(),
});

expensesRouter.get('/', ...staff, async (req, res) => {
  const { matterId } = req.query;
  const expenses = await prisma.expense.findMany({
    where: matterId ? { matterId: matterId as string } : undefined,
    include: { matter: { select: { name: true } } },
    orderBy: { date: 'desc' },
  });
  res.json(expenses);
});

expensesRouter.get('/:id', ...staff, async (req, res) => {
  const expense = await prisma.expense.findUnique({
    where: { id: req.params.id },
    include: { matter: { select: { name: true } } },
  });
  if (!expense) {
    res.status(404).json({ error: 'Expense not found' });
    return;
  }
  res.json(expense);
});

expensesRouter.post('/', ...staff, auditLog('CREATE', 'Expense'), async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
    return;
  }
  const { date, ...rest } = parsed.data;
  const expense = await prisma.expense.create({
    data: { ...rest, date: new Date(date) },
  });
  res.status(201).json(expense);
});

expensesRouter.put('/:id', ...staff, auditLog('UPDATE', 'Expense'), async (req, res) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
    return;
  }
  const existing = await prisma.expense.findUnique({ where: { id: req.params.id } });
  if (!existing) {
    res.status(404).json({ error: 'Expense not found' });
    return;
  }
  const { date, ...rest } = parsed.data;
  const expense = await prisma.expense.update({
    where: { id: req.params.id },
    data: { ...rest, ...(date ? { date: new Date(date) } : {}) },
  });
  res.json(expense);
});

expensesRouter.delete('/:id', ...staff, auditLog('DELETE', 'Expense'), async (req, res) => {
  const existing = await prisma.expense.findUnique({ where: { id: req.params.id } });
  if (!existing) {
    res.status(404).json({ error: 'Expense not found' });
    return;
  }
  await prisma.expense.delete({ where: { id: req.params.id } });
  res.json({ message: 'Expense deleted' });
});
