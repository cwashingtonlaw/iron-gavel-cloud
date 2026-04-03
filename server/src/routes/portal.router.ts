import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';

export const portalRouter = Router();

const clientOnly = [authenticate, authorize('Client')];

// GET /portal/matters — client's matters via MatterContact
portalRouter.get('/matters', ...clientOnly, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
  if (!user) { res.status(404).json({ error: 'User not found' }); return; }

  const contact = await prisma.contact.findFirst({ where: { email: user.email } });
  if (!contact) { res.json([]); return; }

  const matterContacts = await prisma.matterContact.findMany({
    where: { contactId: contact.id },
    include: { matter: true },
  });

  res.json(matterContacts.map(mc => mc.matter));
});

// GET /portal/documents — shared documents for client
portalRouter.get('/documents', ...clientOnly, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
  if (!user) { res.status(404).json({ error: 'User not found' }); return; }

  const contact = await prisma.contact.findFirst({ where: { email: user.email } });
  if (!contact) { res.json([]); return; }

  const shared = await prisma.sharedDocument.findMany({
    where: { contactId: contact.id },
    include: { document: true },
  });

  res.json(shared);
});

// GET /portal/messages?matterId= — portal messages
portalRouter.get('/messages', ...clientOnly, async (req, res) => {
  const matterId = req.query.matterId as string;
  if (!matterId) { res.status(400).json({ error: 'matterId required' }); return; }

  const messages = await prisma.portalMessage.findMany({
    where: { matterId },
    orderBy: { createdAt: 'asc' },
  });

  res.json(messages);
});

// POST /portal/messages — send message
portalRouter.post('/messages', ...clientOnly, async (req, res) => {
  const { matterId, content } = req.body;
  if (!matterId || !content) { res.status(400).json({ error: 'matterId and content required' }); return; }

  const message = await prisma.portalMessage.create({
    data: { matterId, senderId: req.user!.userId, content },
  });

  res.status(201).json(message);
});
