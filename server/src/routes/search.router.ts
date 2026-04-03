import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';

export const searchRouter = Router();
const staff = [authenticate, authorize('Admin', 'Attorney', 'Paralegal')];

searchRouter.get('/', ...staff, async (req, res) => {
  const q = String(req.query.q ?? '').trim();
  if (!q) { res.status(400).json({ error: 'Search query required' }); return; }

  const [matters, contacts, documents] = await Promise.all([
    prisma.matter.findMany({
      where: { OR: [
        { name: { contains: q, mode: 'insensitive' } },
        { client: { contains: q, mode: 'insensitive' } },
        { notes: { contains: q, mode: 'insensitive' } },
      ]},
      take: 10,
    }),
    prisma.contact.findMany({
      where: { OR: [
        { name: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
      ]},
      take: 10,
    }),
    prisma.document.findMany({
      where: { OR: [
        { name: { contains: q, mode: 'insensitive' } },
        { category: { contains: q, mode: 'insensitive' } },
      ]},
      take: 10,
    }),
  ]);

  res.json({ matters, contacts, documents, total: matters.length + contacts.length + documents.length });
});
