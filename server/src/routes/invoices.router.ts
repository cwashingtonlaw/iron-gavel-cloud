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

invoicesRouter.delete('/:id', ...staff, auditLog('DELETE', 'Invoice'), async (req, res) => {
  const existing = await prisma.invoice.findUnique({ where: { id: req.params.id } });
  if (!existing) {
    res.status(404).json({ error: 'Invoice not found' });
    return;
  }
  await prisma.invoice.delete({ where: { id: req.params.id } });
  res.json({ message: 'Invoice deleted' });
});
