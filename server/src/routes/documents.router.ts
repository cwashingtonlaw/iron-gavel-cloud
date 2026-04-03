import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { auditLog } from '../middleware/auditLog.js';

export const documentsRouter = Router();

const staff = [authenticate, authorize('Admin', 'Attorney', 'Paralegal')];

const createSchema = z.object({
  matterId: z.string().min(1),
  name: z.string().min(1),
  category: z.string().min(1),
  size: z.string().default('0'),
  folder: z.string().optional(),
  batesNumber: z.string().optional(),
  isPrivileged: z.boolean().default(false),
  privilegeReason: z.string().optional(),
  discoveryStatus: z.string().optional(),
  sharedWithClient: z.boolean().default(false),
});

const updateSchema = createSchema.partial();

documentsRouter.get('/', ...staff, async (req, res) => {
  const { matterId } = req.query;
  const documents = await prisma.document.findMany({
    where: matterId ? { matterId: matterId as string } : undefined,
    orderBy: { createdAt: 'desc' },
  });
  res.json(documents);
});

documentsRouter.get('/:id', ...staff, async (req, res) => {
  const document = await prisma.document.findUnique({
    where: { id: req.params.id },
    include: { versions: true },
  });
  if (!document) {
    res.status(404).json({ error: 'Document not found' });
    return;
  }
  res.json(document);
});

documentsRouter.post('/', ...staff, auditLog('CREATE', 'Document'), async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
    return;
  }
  const document = await prisma.document.create({
    data: parsed.data,
  });
  res.status(201).json(document);
});

documentsRouter.put('/:id', ...staff, auditLog('UPDATE', 'Document'), async (req, res) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
    return;
  }
  const existing = await prisma.document.findUnique({ where: { id: req.params.id } });
  if (!existing) {
    res.status(404).json({ error: 'Document not found' });
    return;
  }
  const document = await prisma.document.update({
    where: { id: req.params.id },
    data: parsed.data,
  });
  res.json(document);
});

documentsRouter.delete('/:id', ...staff, auditLog('DELETE', 'Document'), async (req, res) => {
  const existing = await prisma.document.findUnique({ where: { id: req.params.id } });
  if (!existing) {
    res.status(404).json({ error: 'Document not found' });
    return;
  }
  await prisma.document.delete({ where: { id: req.params.id } });
  res.json({ message: 'Document deleted' });
});
