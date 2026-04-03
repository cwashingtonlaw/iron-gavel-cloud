import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { auditLog } from '../middleware/auditLog.js';

export const mattersRouter = Router();

const staff = [authenticate, authorize('Admin', 'Attorney', 'Paralegal')];

const createSchema = z.object({
  name: z.string().min(1),
  client: z.string().min(1),
  status: z.enum(['Open', 'Closed', 'Pending']).default('Open'),
  openDate: z.string(),
  billingType: z.enum(['Hourly', 'FlatFee', 'Contingency']),
  billingRate: z.number().optional(),
  billingFee: z.number().optional(),
  notes: z.string().default(''),
  practiceArea: z.string().optional(),
  responsibleAttorneyId: z.string().optional(),
  permissions: z.enum(['Firm', 'Private', 'Selective']).default('Firm'),
  estimatedValue: z.number().optional(),
  description: z.string().optional(),
  location: z.string().optional(),
});

const updateSchema = createSchema.partial();

mattersRouter.get('/', ...staff, async (_req, res) => {
  const matters = await prisma.matter.findMany({
    orderBy: { updatedAt: 'desc' },
    include: { matterContacts: { include: { contact: true } } },
  });
  res.json(matters);
});

mattersRouter.get('/:id', ...staff, async (req, res) => {
  const matter = await prisma.matter.findUnique({
    where: { id: req.params.id },
    include: {
      matterContacts: { include: { contact: true } },
      relatedParties: true,
    },
  });
  if (!matter) {
    res.status(404).json({ error: 'Matter not found' });
    return;
  }
  res.json(matter);
});

mattersRouter.post('/', ...staff, auditLog('CREATE', 'Matter'), async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
    return;
  }
  const { openDate, ...rest } = parsed.data;
  const matter = await prisma.matter.create({
    data: { ...rest, openDate: new Date(openDate) },
  });
  res.status(201).json(matter);
});

mattersRouter.put('/:id', ...staff, auditLog('UPDATE', 'Matter'), async (req, res) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
    return;
  }
  const existing = await prisma.matter.findUnique({ where: { id: req.params.id } });
  if (!existing) {
    res.status(404).json({ error: 'Matter not found' });
    return;
  }
  const { openDate, ...rest } = parsed.data;
  const matter = await prisma.matter.update({
    where: { id: req.params.id },
    data: { ...rest, ...(openDate ? { openDate: new Date(openDate) } : {}) },
  });
  res.json(matter);
});

mattersRouter.delete('/:id', ...staff, auditLog('DELETE', 'Matter'), async (req, res) => {
  const existing = await prisma.matter.findUnique({ where: { id: req.params.id } });
  if (!existing) {
    res.status(404).json({ error: 'Matter not found' });
    return;
  }
  await prisma.matter.delete({ where: { id: req.params.id } });
  res.json({ message: 'Matter deleted' });
});
