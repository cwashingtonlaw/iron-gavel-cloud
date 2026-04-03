import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { auditLog } from '../middleware/auditLog.js';

export const invoicesRouter = Router();

const staff = [authenticate, authorize('Admin', 'Attorney', 'Paralegal')];

const createSchema = z.object({
  matterId: z.string().min(1),
  issueDate: z.string(),
  dueDate: z.string(),
  amount: z.number(),
  status: z.enum(['Paid', 'Unpaid', 'Overdue']).default('Unpaid'),
  balance: z.number().optional(),
  clientName: z.string().optional(),
});

const updateSchema = z.object({
  matterId: z.string().min(1).optional(),
  issueDate: z.string().optional(),
  dueDate: z.string().optional(),
  amount: z.number().optional(),
  status: z.enum(['Paid', 'Unpaid', 'Overdue']).optional(),
  balance: z.number().optional(),
  clientName: z.string().optional(),
});

invoicesRouter.get('/', ...staff, async (req, res) => {
  const { matterId } = req.query;
  const invoices = await prisma.invoice.findMany({
    where: matterId ? { matterId: matterId as string } : undefined,
    include: { matter: { select: { name: true } } },
    orderBy: { issueDate: 'desc' },
  });
  res.json(invoices);
});

invoicesRouter.get('/:id', ...staff, async (req, res) => {
  const invoice = await prisma.invoice.findUnique({
    where: { id: req.params.id },
    include: { matter: { select: { name: true } } },
  });
  if (!invoice) {
    res.status(404).json({ error: 'Invoice not found' });
    return;
  }
  res.json(invoice);
});

invoicesRouter.post('/', ...staff, auditLog('CREATE', 'Invoice'), async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
    return;
  }
  const { issueDate, dueDate, ...rest } = parsed.data;
  const invoice = await prisma.invoice.create({
    data: { ...rest, issueDate: new Date(issueDate), dueDate: new Date(dueDate) },
  });
  res.status(201).json(invoice);
});

invoicesRouter.put('/:id', ...staff, auditLog('UPDATE', 'Invoice'), async (req, res) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
    return;
  }
  const existing = await prisma.invoice.findUnique({ where: { id: req.params.id } });
  if (!existing) {
    res.status(404).json({ error: 'Invoice not found' });
    return;
  }
  const { issueDate, dueDate, ...rest } = parsed.data;
  const invoice = await prisma.invoice.update({
    where: { id: req.params.id },
    data: {
      ...rest,
      ...(issueDate ? { issueDate: new Date(issueDate) } : {}),
      ...(dueDate ? { dueDate: new Date(dueDate) } : {}),
    },
  });
  res.json(invoice);
});

// POST /api/v1/invoices/generate — auto-generate invoice from unbilled time + expenses
invoicesRouter.post('/generate', ...staff, auditLog('CREATE', 'Invoice'), async (req, res) => {
  const { matterId } = req.body;
  if (!matterId) {
    res.status(400).json({ error: 'matterId is required' });
    return;
  }

  const matter = await prisma.matter.findUnique({ where: { id: matterId } });
  if (!matter) {
    res.status(404).json({ error: 'Matter not found' });
    return;
  }

  const unbilledTime = await prisma.timeEntry.findMany({
    where: { matterId, isBilled: false },
  });
  const unbilledExpenses = await prisma.expense.findMany({
    where: { matterId, isBilled: false },
  });

  const timeTotal = unbilledTime.reduce((sum, t) => sum + t.duration * t.rate, 0);
  const expenseTotal = unbilledExpenses.reduce((sum, e) => sum + e.amount, 0);
  const total = timeTotal + expenseTotal;

  if (total === 0) {
    res.status(400).json({ error: 'No unbilled time or expenses to invoice' });
    return;
  }

  const invoice = await prisma.invoice.create({
    data: {
      matterId,
      issueDate: new Date(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      amount: total,
      balance: total,
      clientName: matter.client,
      status: 'Unpaid',
    },
  });

  // Mark everything as billed
  await prisma.timeEntry.updateMany({
    where: { id: { in: unbilledTime.map(t => t.id) } },
    data: { isBilled: true },
  });
  await prisma.expense.updateMany({
    where: { id: { in: unbilledExpenses.map(e => e.id) } },
    data: { isBilled: true },
  });

  res.status(201).json({
    ...invoice,
    timeEntries: unbilledTime.length,
    expenses: unbilledExpenses.length,
    timeTotal,
    expenseTotal,
  });
});

invoicesRouter.delete('/:id', ...staff, auditLog('DELETE', 'Invoice'), async (req, res) => {
  const existing = await prisma.invoice.findUnique({ where: { id: req.params.id } });
  if (!existing) {
    res.status(404).json({ error: 'Invoice not found' });
    return;
  }
  await prisma.invoice.delete({ where: { id: req.params.id } });
  res.json({ message: 'Invoice deleted' });
});
