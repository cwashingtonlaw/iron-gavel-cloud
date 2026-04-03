import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { app } from '../app.js';
import { prisma } from '../lib/prisma.js';
import { generateAccessToken } from '../auth/auth.service.js';

const adminToken = generateAccessToken({ userId: 'USER_DOCS_1', role: 'Admin' });
let createdDocumentId: string;
let testMatterId: string;

// A small temporary PDF-like file for upload tests
const testFilePath = path.join(os.tmpdir(), 'test-upload.pdf');

beforeAll(async () => {
  // Create a tiny test file
  fs.writeFileSync(testFilePath, '%PDF-1.4 test content for iron-gavel upload');

  await prisma.user.upsert({
    where: { id: 'USER_DOCS_1' },
    update: {},
    create: {
      id: 'USER_DOCS_1',
      email: 'docs-admin@test.com',
      passwordHash: 'x',
      name: 'Docs Admin',
      role: 'Admin',
      defaultRate: 350,
    },
  });

  const matter = await prisma.matter.create({
    data: {
      name: 'Documents Test Matter',
      client: 'Documents Test Client',
      status: 'Open',
      openDate: new Date('2026-01-01'),
      billingType: 'Hourly',
    },
  });
  testMatterId = matter.id;
});

afterAll(async () => {
  if (testFilePath && fs.existsSync(testFilePath)) {
    fs.unlinkSync(testFilePath);
  }
  if (testMatterId) {
    await prisma.documentVersion.deleteMany({
      where: { document: { matterId: testMatterId } },
    });
    await prisma.document.deleteMany({ where: { matterId: testMatterId } });
    await prisma.matter.deleteMany({ where: { id: testMatterId } });
  }
  await prisma.$disconnect();
});

describe('Documents CRUD', () => {
  it('POST /api/v1/documents — creates a document record', async () => {
    const res = await request(app)
      .post('/api/v1/documents')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        matterId: testMatterId,
        name: 'Police Report.pdf',
        category: 'Police Reports',
      });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Police Report.pdf');
    expect(res.body.category).toBe('Police Reports');
    expect(res.body.id).toBeDefined();
    createdDocumentId = res.body.id;
  });

  it('GET /api/v1/documents?matterId= — lists documents for a matter', async () => {
    const res = await request(app)
      .get(`/api/v1/documents?matterId=${testMatterId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0].matterId).toBe(testMatterId);
  });

  it('GET /api/v1/documents/:id — gets a single document with versions', async () => {
    const res = await request(app)
      .get(`/api/v1/documents/${createdDocumentId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Police Report.pdf');
    expect(Array.isArray(res.body.versions)).toBe(true);
  });

  it('PUT /api/v1/documents/:id — updates a document (set batesNumber)', async () => {
    const res = await request(app)
      .put(`/api/v1/documents/${createdDocumentId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ batesNumber: 'DEF-001234' });

    expect(res.status).toBe(200);
    expect(res.body.batesNumber).toBe('DEF-001234');
  });

  it('DELETE /api/v1/documents/:id — deletes a document', async () => {
    const res = await request(app)
      .delete(`/api/v1/documents/${createdDocumentId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    createdDocumentId = '';
  });
});

describe('File Upload (Task 2)', () => {
  it('POST /api/v1/documents/upload — succeeds with valid file + matterId', async () => {
    const res = await request(app)
      .post('/api/v1/documents/upload')
      .set('Authorization', `Bearer ${adminToken}`)
      .field('matterId', testMatterId)
      .field('category', 'Police Reports')
      .attach('file', testFilePath, 'test-upload.pdf');

    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.matterId).toBe(testMatterId);
    expect(res.body.name).toBe('test-upload.pdf');
    expect(Array.isArray(res.body.versions)).toBe(true);
    expect(res.body.versions.length).toBe(1);
    expect(res.body.versions[0].version).toBe(1);
  });

  it('POST /api/v1/documents/upload — rejects without matterId', async () => {
    const res = await request(app)
      .post('/api/v1/documents/upload')
      .set('Authorization', `Bearer ${adminToken}`)
      .attach('file', testFilePath, 'test-upload.pdf');

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/matterId/i);
  });
});

describe('File Download (Task 3)', () => {
  it('GET /api/v1/documents/:id/download — streams file content back', async () => {
    // Upload first
    const uploadRes = await request(app)
      .post('/api/v1/documents/upload')
      .set('Authorization', `Bearer ${adminToken}`)
      .field('matterId', testMatterId)
      .field('category', 'Evidence')
      .attach('file', testFilePath, 'download-test.pdf');

    expect(uploadRes.status).toBe(201);
    const docId = uploadRes.body.id;

    // Download and verify content
    const dlRes = await request(app)
      .get(`/api/v1/documents/${docId}/download`)
      .set('Authorization', `Bearer ${adminToken}`)
      .buffer(true)
      .parse((res, callback) => {
        const chunks: Buffer[] = [];
        res.on('data', (chunk: Buffer) => chunks.push(chunk));
        res.on('end', () => callback(null, Buffer.concat(chunks).toString()));
      });

    expect(dlRes.status).toBe(200);
    expect(dlRes.headers['content-type']).toMatch(/pdf/);
    expect(dlRes.headers['content-disposition']).toMatch(/attachment/);
    expect(dlRes.body).toContain('%PDF-1.4 test content');
  });

  it('GET /api/v1/documents/:nonexistent/download — returns 404', async () => {
    const res = await request(app)
      .get('/api/v1/documents/nonexistent-id-xyz/download')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(404);
  });
});
