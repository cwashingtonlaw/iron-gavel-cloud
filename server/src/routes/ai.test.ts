import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { generateAccessToken } from '../auth/auth.service.js';

const token = generateAccessToken({ userId: 'USER_1', role: 'Admin' });

describe('AI Proxy', () => {
  it('POST /ai/chat returns 503 without GEMINI_API_KEY', async () => {
    const origKey = process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_API_KEY;

    const res = await request(app)
      .post('/api/v1/ai/chat')
      .set('Authorization', `Bearer ${token}`)
      .send({ message: 'hello' });

    expect(res.status).toBe(503);
    expect(res.body.error).toContain('not configured');

    if (origKey) process.env.GEMINI_API_KEY = origKey;
  });

  it('POST /ai/chat returns 400 without message', async () => {
    const res = await request(app)
      .post('/api/v1/ai/chat')
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(res.status).toBe(400);
  });

  it('POST /ai/summarize returns 400 without content', async () => {
    const res = await request(app)
      .post('/api/v1/ai/summarize')
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(res.status).toBe(400);
  });

  it('POST /ai/draft returns 400 without prompt', async () => {
    const res = await request(app)
      .post('/api/v1/ai/draft')
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(res.status).toBe(400);
  });

  it('rejects unauthenticated request', async () => {
    const res = await request(app).post('/api/v1/ai/chat').send({ message: 'hello' });
    expect(res.status).toBe(401);
  });
});
