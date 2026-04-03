import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { auditLog } from '../middleware/auditLog.js';

export const tasksRouter = Router();

const staff = [authenticate, authorize('Admin', 'Attorney', 'Paralegal')];

const createSchema = z.object({
  matterId: z.string().min(1),
  description: z.string().min(1),
  notes: z.string().optional(),
  dueDate: z.string(),
  priority: z.enum(['High', 'Medium', 'Low']).default('Medium'),
  recurrence: z.string().optional(),
  assignedUserId: z.string().optional(),
  assignedByUserId: z.string().optional(),
});

const updateSchema = z.object({
  description: z.string().min(1).optional(),
  notes: z.string().optional(),
  dueDate: z.string().optional(),
  completed: z.boolean().optional(),
  priority: z.enum(['High', 'Medium', 'Low']).optional(),
  assignedUserId: z.string().optional(),
});

tasksRouter.get('/', ...staff, async (req, res) => {
  const { matterId } = req.query;
  const tasks = await prisma.task.findMany({
    where: matterId ? { matterId: matterId as string } : undefined,
    orderBy: { dueDate: 'asc' },
  });
  res.json(tasks);
});

tasksRouter.get('/:id', ...staff, async (req, res) => {
  const task = await prisma.task.findUnique({
    where: { id: req.params.id },
  });
  if (!task) {
    res.status(404).json({ error: 'Task not found' });
    return;
  }
  res.json(task);
});

tasksRouter.post('/', ...staff, auditLog('CREATE', 'Task'), async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
    return;
  }
  const { dueDate, ...rest } = parsed.data;
  const task = await prisma.task.create({
    data: { ...rest, dueDate: new Date(dueDate) },
  });
  res.status(201).json(task);
});

tasksRouter.put('/:id', ...staff, auditLog('UPDATE', 'Task'), async (req, res) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
    return;
  }
  const existing = await prisma.task.findUnique({ where: { id: req.params.id } });
  if (!existing) {
    res.status(404).json({ error: 'Task not found' });
    return;
  }
  const { dueDate, ...rest } = parsed.data;
  const task = await prisma.task.update({
    where: { id: req.params.id },
    data: { ...rest, ...(dueDate ? { dueDate: new Date(dueDate) } : {}) },
  });
  res.json(task);
});

tasksRouter.delete('/:id', ...staff, auditLog('DELETE', 'Task'), async (req, res) => {
  const existing = await prisma.task.findUnique({ where: { id: req.params.id } });
  if (!existing) {
    res.status(404).json({ error: 'Task not found' });
    return;
  }
  await prisma.task.delete({ where: { id: req.params.id } });
  res.json({ message: 'Task deleted' });
});
