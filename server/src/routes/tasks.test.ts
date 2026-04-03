import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { prisma } from '../lib/prisma.js';
import { generateAccessToken } from '../auth/auth.service.js';

const adminToken = generateAccessToken({ userId: 'USER_TASKS_1', role: 'Admin' });
let createdTaskId: string;
let testMatterId: string;

beforeAll(async () => {
  await prisma.user.upsert({
    where: { id: 'USER_TASKS_1' },
    update: {},
    create: {
      id: 'USER_TASKS_1',
      email: 'tasks-admin@test.com',
      passwordHash: 'x',
      name: 'Tasks Admin',
      role: 'Admin',
      defaultRate: 350,
    },
  });

  const matter = await prisma.matter.create({
    data: {
      name: 'Tasks Test Matter',
      client: 'Tasks Test Client',
      status: 'Open',
      openDate: new Date('2026-01-01'),
      billingType: 'Hourly',
    },
  });
  testMatterId = matter.id;
});

afterAll(async () => {
  if (createdTaskId) {
    await prisma.task.deleteMany({ where: { id: createdTaskId } });
  }
  if (testMatterId) {
    await prisma.matter.deleteMany({ where: { id: testMatterId } });
  }
  await prisma.$disconnect();
});

describe('Tasks CRUD', () => {
  it('POST /api/v1/tasks — creates a task', async () => {
    const res = await request(app)
      .post('/api/v1/tasks')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        matterId: testMatterId,
        description: 'File motion to suppress',
        dueDate: '2026-05-01',
        priority: 'High',
      });

    expect(res.status).toBe(201);
    expect(res.body.description).toBe('File motion to suppress');
    expect(res.body.id).toBeDefined();
    createdTaskId = res.body.id;
  });

  it('GET /api/v1/tasks?matterId= — lists tasks for a matter', async () => {
    const res = await request(app)
      .get(`/api/v1/tasks?matterId=${testMatterId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0].matterId).toBe(testMatterId);
  });

  it('GET /api/v1/tasks/:id — gets a single task', async () => {
    const res = await request(app)
      .get(`/api/v1/tasks/${createdTaskId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.description).toBe('File motion to suppress');
  });

  it('PUT /api/v1/tasks/:id — updates a task (set completed=true)', async () => {
    const res = await request(app)
      .put(`/api/v1/tasks/${createdTaskId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ completed: true });

    expect(res.status).toBe(200);
    expect(res.body.completed).toBe(true);
  });

  it('DELETE /api/v1/tasks/:id — deletes a task', async () => {
    const res = await request(app)
      .delete(`/api/v1/tasks/${createdTaskId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    createdTaskId = '';
  });
});
