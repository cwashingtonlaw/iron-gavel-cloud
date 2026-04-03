import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { auditLog } from '../middleware/auditLog.js';

export const eventsRouter = Router();

const staff = [authenticate, authorize('Admin', 'Attorney', 'Paralegal')];

const createSchema = z.object({
  matterId: z.string().min(1),
  title: z.string().min(1),
  date: z.string().min(1),
  startTime: z.string().min(1),
  endTime: z.string().min(1),
  type: z.string().min(1),
  location: z.string().default(''),
  allDay: z.boolean().default(false),
  description: z.string().optional(),
  recurrence: z.any().optional(),
  attendees: z.array(z.string()).optional(),
  reminders: z.any().optional(),
});

const updateSchema = createSchema.partial();

eventsRouter.get('/', ...staff, async (req, res) => {
  const { matterId } = req.query;
  const events = await prisma.event.findMany({
    where: matterId ? { matterId: matterId as string } : undefined,
    orderBy: { date: 'asc' },
  });
  res.json(events);
});

eventsRouter.get('/:id', ...staff, async (req, res) => {
  const event = await prisma.event.findUnique({
    where: { id: req.params.id },
  });
  if (!event) {
    res.status(404).json({ error: 'Event not found' });
    return;
  }
  res.json(event);
});

eventsRouter.post('/', ...staff, auditLog('CREATE', 'Event'), async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
    return;
  }
  const { date, ...rest } = parsed.data;
  const event = await prisma.event.create({
    data: { ...rest, date: new Date(date) },
  });
  res.status(201).json(event);
});

eventsRouter.put('/:id', ...staff, auditLog('UPDATE', 'Event'), async (req, res) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
    return;
  }
  const existing = await prisma.event.findUnique({ where: { id: req.params.id } });
  if (!existing) {
    res.status(404).json({ error: 'Event not found' });
    return;
  }
  const { date, ...rest } = parsed.data;
  const event = await prisma.event.update({
    where: { id: req.params.id },
    data: { ...rest, ...(date ? { date: new Date(date) } : {}) },
  });
  res.json(event);
});

eventsRouter.delete('/:id', ...staff, auditLog('DELETE', 'Event'), async (req, res) => {
  const existing = await prisma.event.findUnique({ where: { id: req.params.id } });
  if (!existing) {
    res.status(404).json({ error: 'Event not found' });
    return;
  }
  await prisma.event.delete({ where: { id: req.params.id } });
  res.json({ message: 'Event deleted' });
});
