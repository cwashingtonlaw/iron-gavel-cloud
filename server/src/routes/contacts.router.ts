import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { auditLog } from '../middleware/auditLog.js';

export const contactsRouter = Router();

const staff = [authenticate, authorize('Admin', 'Attorney', 'Paralegal')];

const createSchema = z.object({
  name: z.string().min(1),
  email: z.string().default(''),
  phone: z.string().default(''),
  type: z.enum(['Client', 'Witness', 'Counsel', 'PotentialClient']),
  hasPortalAccess: z.boolean().default(false),
  isCompany: z.boolean().default(false),
  prefix: z.string().optional(),
  firstName: z.string().optional(),
  middleName: z.string().optional(),
  lastName: z.string().optional(),
  companyName: z.string().optional(),
  title: z.string().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
  value: z.number().optional(),
});

const updateSchema = createSchema.partial();

contactsRouter.get('/', ...staff, async (_req, res) => {
  const contacts = await prisma.contact.findMany({
    orderBy: { updatedAt: 'desc' },
  });
  res.json(contacts);
});

contactsRouter.get('/:id', ...staff, async (req, res) => {
  const contact = await prisma.contact.findUnique({
    where: { id: req.params.id },
  });
  if (!contact) {
    res.status(404).json({ error: 'Contact not found' });
    return;
  }
  res.json(contact);
});

contactsRouter.post('/', ...staff, auditLog('CREATE', 'Contact'), async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
    return;
  }
  const contact = await prisma.contact.create({
    data: parsed.data,
  });
  res.status(201).json(contact);
});

contactsRouter.put('/:id', ...staff, auditLog('UPDATE', 'Contact'), async (req, res) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
    return;
  }
  const existing = await prisma.contact.findUnique({ where: { id: req.params.id } });
  if (!existing) {
    res.status(404).json({ error: 'Contact not found' });
    return;
  }
  const contact = await prisma.contact.update({
    where: { id: req.params.id },
    data: parsed.data,
  });
  res.json(contact);
});

contactsRouter.delete('/:id', ...staff, auditLog('DELETE', 'Contact'), async (req, res) => {
  const existing = await prisma.contact.findUnique({ where: { id: req.params.id } });
  if (!existing) {
    res.status(404).json({ error: 'Contact not found' });
    return;
  }
  await prisma.contact.delete({ where: { id: req.params.id } });
  res.json({ message: 'Contact deleted' });
});
