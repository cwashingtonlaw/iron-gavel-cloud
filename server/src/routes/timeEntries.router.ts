import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { auditLog } from '../middleware/auditLog.js';

export const timeEntriesRouter = Router();

const staff = [authenticate, authorize('Admin', 'Attorney', 'Paralegal')];

const createSchema = z.object({
  matterId: z.string().min(1),
  userId: z.string().min(1),
  date: z.string(),
  description: z.string().min(1),
  duration: z.number(),
  rate: z.number(),
  isBilled: z.boolean().default(false),
});

const updateSchema = z.object({
  matterId: z.string().min(1).optional(),
  userId: z.string().min(1).optional(),
  date: z.string().optional(),
  description: z.string().min(1).optional(),
  duration: z.number().optional(),
  rate: z.number().optional(),
  isBilled: z.boolean().optional(),
});

timeEntriesRouter.get('/', ...staff, async (req, res) => {
  const { matterId } = req.query;
  const entries = await prisma.timeEntry.findMany({
    where: matterId ? { matterId: matterId as string } : undefined,
    include: { matter: { select: { name: true } } },
    orderBy: { date: 'desc' },
  });
  res.json(entries);
});

timeEntriesRouter.get('/:id', ...staff, async (req, res) => {
  const entry = await prisma.timeEntry.findUnique({
    where: { id: req.params.id },
    include: { matter: { select: { name: true } } },
  });
  if (!entry) {
    res.status(404).json({ error: 'Time entry not found' });
    return;
  }
  res.json(entry);
});

timeEntriesRouter.post('/', ...staff, auditLog('CREATE', 'TimeEntry'), async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
    return;
  }
  const { date, ...rest } = parsed.data;
  const entry = await prisma.timeEntry.create({
    data: { ...rest, date: new Date(date) },
  });
  res.status(201).json(entry);
});

timeEntriesRouter.put('/:id', ...staff, auditLog('UPDATE', 'TimeEntry'), async (req, res) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
    return;
  }
  const existing = await prisma.timeEntry.findUnique({ where: { id: req.params.id } });
  if (!existing) {
    res.status(404).json({ error: 'Time entry not found' });
    return;
  }
  const { date, ...rest } = parsed.data;
  const entry = await prisma.timeEntry.update({
    where: { id: req.params.id },
    data: { ...rest, ...(date ? { date: new Date(date) } : {}) },
  });
  res.json(entry);
});

timeEntriesRouter.delete('/:id', ...staff, auditLog('DELETE', 'TimeEntry'), async (req, res) => {
  const existing = await prisma.timeEntry.findUnique({ where: { id: req.params.id } });
  if (!existing) {
    res.status(404).json({ error: 'Time entry not found' });
    return;
  }
  await prisma.timeEntry.delete({ where: { id: req.params.id } });
  res.json({ message: 'Time entry deleted' });
});
