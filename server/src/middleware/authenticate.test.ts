import { describe, it, expect } from 'vitest';
import request from 'supertest';
import express from 'express';
import { authenticate } from './authenticate.js';
import { generateAccessToken } from '../auth/auth.service.js';

function createTestApp() {
  const app = express();
  app.use(express.json());
  app.get('/protected', authenticate, (req, res) => {
    res.json({ userId: req.user!.userId, role: req.user!.role });
  });
  return app;
}

describe('authenticate middleware', () => {
  const testApp = createTestApp();

  it('passes with valid Bearer token', async () => {
    const token = generateAccessToken({ userId: 'USER_1', role: 'Admin' });
    const res = await request(testApp)
      .get('/protected')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.userId).toBe('USER_1');
    expect(res.body.role).toBe('Admin');
  });

  it('rejects request without Authorization header', async () => {
    const res = await request(testApp).get('/protected');
    expect(res.status).toBe(401);
  });

  it('rejects invalid token', async () => {
    const res = await request(testApp)
      .get('/protected')
      .set('Authorization', 'Bearer invalid.token');

    expect(res.status).toBe(401);
  });

  it('rejects expired token', async () => {
    const jwt = await import('jsonwebtoken');
    const token = jwt.default.sign(
      { userId: 'USER_1', role: 'Admin' },
      process.env.JWT_ACCESS_SECRET ?? 'dev-access-secret-change-in-production',
      { expiresIn: '0s' }
    );

    const res = await request(testApp)
      .get('/protected')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(401);
  });
});
