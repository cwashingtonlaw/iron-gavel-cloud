import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { prisma } from '../lib/prisma.js';

beforeAll(async () => {
  await prisma.session.deleteMany({ where: { user: { email: { startsWith: 'test-auth' } } } });
  await prisma.user.deleteMany({ where: { email: { startsWith: 'test-auth' } } });
});

afterAll(async () => {
  await prisma.session.deleteMany({ where: { user: { email: { startsWith: 'test-auth' } } } });
  await prisma.user.deleteMany({ where: { email: { startsWith: 'test-auth' } } });
  await prisma.$disconnect();
});

describe('POST /api/v1/auth/register', () => {
  it('creates a new user and returns tokens', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'test-auth-register@example.com',
        password: 'password123',
        name: 'Test User',
        role: 'Attorney',
      });

    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe('test-auth-register@example.com');
    expect(res.body.user.role).toBe('Attorney');
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.user.passwordHash).toBeUndefined();
    expect(res.headers['set-cookie']).toBeDefined();
  });

  it('rejects duplicate email', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'test-auth-register@example.com',
        password: 'password123',
        name: 'Duplicate User',
        role: 'Attorney',
      });

    expect(res.status).toBe(409);
  });

  it('rejects invalid input', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'bad', password: '123' });

    expect(res.status).toBe(400);
  });
});

describe('POST /api/v1/auth/login', () => {
  it('returns tokens for valid credentials', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'test-auth-register@example.com',
        password: 'password123',
      });

    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.user.email).toBe('test-auth-register@example.com');
  });

  it('rejects wrong password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'test-auth-register@example.com',
        password: 'wrongpassword',
      });

    expect(res.status).toBe(401);
  });

  it('rejects nonexistent user', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'nobody@example.com',
        password: 'password123',
      });

    expect(res.status).toBe(401);
  });
});

describe('POST /api/v1/auth/refresh', () => {
  it('returns new access token with valid refresh cookie', async () => {
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'test-auth-register@example.com',
        password: 'password123',
      });

    const cookies = loginRes.headers['set-cookie'];

    const res = await request(app)
      .post('/api/v1/auth/refresh')
      .set('Cookie', cookies);

    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeDefined();
  });

  it('rejects request without refresh cookie', async () => {
    const res = await request(app).post('/api/v1/auth/refresh');
    expect(res.status).toBe(401);
  });
});

describe('POST /api/v1/auth/logout', () => {
  it('clears the refresh cookie and deletes session', async () => {
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'test-auth-register@example.com',
        password: 'password123',
      });

    const cookies = loginRes.headers['set-cookie'];
    const token = loginRes.body.accessToken;

    const res = await request(app)
      .post('/api/v1/auth/logout')
      .set('Cookie', cookies)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    const setCookie = res.headers['set-cookie']?.[0] ?? '';
    expect(setCookie).toContain('refreshToken=;');
  });
});
