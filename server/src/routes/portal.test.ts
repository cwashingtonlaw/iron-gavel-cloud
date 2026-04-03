import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { prisma } from '../lib/prisma.js';
import { generateAccessToken } from '../auth/auth.service.js';

const adminToken = generateAccessToken({ userId: 'PORTAL_ADMIN', role: 'Admin' });
const clientToken = generateAccessToken({ userId: 'PORTAL_CLIENT', role: 'Client' });
let matterId: string;
let contactId: string;

beforeAll(async () => {
  await prisma.user.upsert({ where: { id: 'PORTAL_ADMIN' }, update: {}, create: { id: 'PORTAL_ADMIN', email: 'portal-admin@test.com', passwordHash: 'x', name: 'Admin', role: 'Admin' } });
  await prisma.user.upsert({ where: { id: 'PORTAL_CLIENT' }, update: {}, create: { id: 'PORTAL_CLIENT', email: 'portal-client@test.com', passwordHash: 'x', name: 'Client User', role: 'Client' } });

  const contact = await prisma.contact.create({ data: { name: 'Client User', email: 'portal-client@test.com', type: 'Client', hasPortalAccess: true } });
  contactId = contact.id;

  const matter = await prisma.matter.create({ data: { name: 'Portal Test Matter', client: 'Client User', status: 'Open', openDate: new Date(), billingType: 'Hourly', permissions: 'Firm' } });
  matterId = matter.id;

  await prisma.matterContact.create({ data: { matterId, contactId, role: 'Client' } });
});

afterAll(async () => {
  await prisma.portalMessage.deleteMany({ where: { matterId } });
  await prisma.matterContact.deleteMany({ where: { matterId } });
  await prisma.matter.deleteMany({ where: { id: matterId } });
  await prisma.contact.deleteMany({ where: { id: contactId } });
  await prisma.user.deleteMany({ where: { id: { in: ['PORTAL_ADMIN', 'PORTAL_CLIENT'] } } });
  await prisma.$disconnect();
});

describe('Client Portal', () => {
  it('client can list their matters', async () => {
    const res = await request(app).get('/api/v1/portal/matters').set('Authorization', `Bearer ${clientToken}`);
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0].name).toBe('Portal Test Matter');
  });

  it('client can send and list messages', async () => {
    const sendRes = await request(app).post('/api/v1/portal/messages').set('Authorization', `Bearer ${clientToken}`).send({ matterId, content: 'Hello from client' });
    expect(sendRes.status).toBe(201);

    const listRes = await request(app).get(`/api/v1/portal/messages?matterId=${matterId}`).set('Authorization', `Bearer ${clientToken}`);
    expect(listRes.status).toBe(200);
    expect(listRes.body.length).toBeGreaterThan(0);
  });

  it('client cannot access staff routes', async () => {
    const res = await request(app).get('/api/v1/matters').set('Authorization', `Bearer ${clientToken}`);
    expect(res.status).toBe(403);
  });

  it('admin can invite a client', async () => {
    const res = await request(app).post('/api/v1/auth/invite-client').set('Authorization', `Bearer ${adminToken}`).send({ email: 'invited@test.com', name: 'Invited Client' });
    expect(res.status).toBe(201);
    expect(res.body.tempPassword).toBeDefined();
    // Clean up
    await prisma.user.deleteMany({ where: { email: 'invited@test.com' } });
  });
});
