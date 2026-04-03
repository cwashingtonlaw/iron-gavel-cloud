import { describe, it, expect } from 'vitest';
import request from 'supertest';
import express from 'express';
import { authenticate } from './authenticate.js';
import { authorize } from './authorize.js';
import { generateAccessToken } from '../auth/auth.service.js';

function createTestApp() {
  const app = express();
  app.use(express.json());
  app.get('/admin-only', authenticate, authorize('Admin'), (_req, res) => {
    res.json({ ok: true });
  });
  app.get('/staff', authenticate, authorize('Admin', 'Attorney', 'Paralegal'), (_req, res) => {
    res.json({ ok: true });
  });
  return app;
}

describe('authorize middleware', () => {
  const testApp = createTestApp();

  it('allows user with required role', async () => {
    const token = generateAccessToken({ userId: 'USER_1', role: 'Admin' });
    const res = await request(testApp)
      .get('/admin-only')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });

  it('rejects user without required role', async () => {
    const token = generateAccessToken({ userId: 'USER_3', role: 'Paralegal' });
    const res = await request(testApp)
      .get('/admin-only')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it('allows any of multiple roles', async () => {
    const token = generateAccessToken({ userId: 'USER_2', role: 'Attorney' });
    const res = await request(testApp)
      .get('/staff')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });

  it('rejects Client from staff route', async () => {
    const token = generateAccessToken({ userId: 'USER_4', role: 'Client' });
    const res = await request(testApp)
      .get('/staff')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });
});
