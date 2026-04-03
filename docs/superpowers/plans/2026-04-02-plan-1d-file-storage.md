# Plan 1D: File Storage — Upload, Download, Versioning

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add file upload, download, and versioning to the existing documents CRUD, storing files on the NAS volume at `/data/iron-gavel/files/`.

**Architecture:** Multer handles multipart file uploads. Files are stored on disk at `/data/iron-gavel/files/matters/{matterId}/{documentId}_v{n}.{ext}`. Each upload creates a `DocumentVersion` row. Downloads stream from disk with proper Content-Type. The existing documents router is extended — not replaced.

**Tech Stack:** multer (file upload), mime-types (Content-Type detection), Express streams, existing Prisma + auth middleware

**Database connectivity note:** Integration tests MUST run inside Docker:
```bash
export PATH="/Applications/Docker.app/Contents/Resources/bin:$PATH"
cd /tmp/iron-gavel-deploy
docker run --rm --network iron-gavel-deploy_default \
  -v "$(pwd):/app" -w /app/server \
  -e DATABASE_URL="postgresql://irongavel:irongavel@db:5432/irongavel?schema=public" \
  node:20-alpine sh -c "npx vitest run <test-file>"
```

---

## File Structure

```
server/src/
├── lib/
│   └── storage.ts             — File system helpers (ensureDir, getFilePath, getAllowedTypes)
├── routes/
│   ├── documents.router.ts    — (modify) Add upload, download, versioning endpoints
│   └── documents.test.ts      — (modify) Add upload/download/version tests
```

---

### Task 1: Install multer and mime-types, create storage helper

**Files:**
- Modify: `server/package.json`
- Create: `server/src/lib/storage.ts`
- Create: `server/src/lib/storage.test.ts`

- [ ] **Step 1: Install dependencies**

```bash
cd /tmp/iron-gavel-deploy && npm install multer mime-types --workspace=@iron-gavel/server && npm install @types/multer @types/mime-types --save-dev --workspace=@iron-gavel/server
```

- [ ] **Step 2: Write the failing test**

Create `server/src/lib/storage.test.ts`:

```typescript
import { describe, it, expect, afterAll } from 'vitest';
import fs from 'fs';
import path from 'path';
import { ensureDir, getFilePath, ALLOWED_EXTENSIONS } from './storage.js';

const TEST_DIR = '/tmp/iron-gavel-storage-test';

afterAll(() => {
  fs.rmSync(TEST_DIR, { recursive: true, force: true });
});

describe('storage helpers', () => {
  it('ensureDir creates nested directories', () => {
    const dir = path.join(TEST_DIR, 'a', 'b', 'c');
    ensureDir(dir);
    expect(fs.existsSync(dir)).toBe(true);
  });

  it('getFilePath returns correct path structure', () => {
    const result = getFilePath('MAT-001', 'DOC-123', 1, 'report.pdf');
    expect(result).toContain('matters/MAT-001');
    expect(result).toContain('DOC-123_v1.pdf');
  });

  it('getFilePath preserves file extension', () => {
    const result = getFilePath('MAT-001', 'DOC-456', 2, 'photo.jpg');
    expect(result).toContain('DOC-456_v2.jpg');
  });

  it('ALLOWED_EXTENSIONS contains expected types', () => {
    expect(ALLOWED_EXTENSIONS).toContain('.pdf');
    expect(ALLOWED_EXTENSIONS).toContain('.docx');
    expect(ALLOWED_EXTENSIONS).toContain('.jpg');
    expect(ALLOWED_EXTENSIONS).toContain('.mp4');
  });
});
```

- [ ] **Step 3: Implement storage helper**

Create `server/src/lib/storage.ts`:

```typescript
import fs from 'fs';
import path from 'path';

const UPLOAD_ROOT = process.env.UPLOAD_ROOT ?? '/data/iron-gavel/files';

export const ALLOWED_EXTENSIONS = [
  '.pdf', '.docx', '.doc', '.xlsx', '.csv',
  '.png', '.jpg', '.jpeg', '.tiff',
  '.mp3', '.mp4', '.wav',
];

export const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

export function ensureDir(dir: string): void {
  fs.mkdirSync(dir, { recursive: true });
}

export function getFilePath(matterId: string, documentId: string, version: number, originalName: string): string {
  const ext = path.extname(originalName).toLowerCase();
  return path.join(UPLOAD_ROOT, 'matters', matterId, `${documentId}_v${version}${ext}`);
}

export function getMatterDir(matterId: string): string {
  return path.join(UPLOAD_ROOT, 'matters', matterId);
}
```

- [ ] **Step 4: Run tests**

```bash
cd /tmp/iron-gavel-deploy/server && npx vitest run src/lib/storage.test.ts
```

Expected: 4 tests PASS.

- [ ] **Step 5: Commit**

```bash
cd /tmp/iron-gavel-deploy && git add server/package.json package-lock.json server/src/lib/storage.ts server/src/lib/storage.test.ts
git commit -m "feat: install multer and add file storage helpers"
```

---

### Task 2: Add file upload endpoint

**Files:**
- Modify: `server/src/routes/documents.router.ts`
- Modify: `server/src/routes/documents.test.ts`

- [ ] **Step 1: Add upload endpoint to documents router**

Add these imports to the top of `server/src/routes/documents.router.ts`:

```typescript
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { ensureDir, getFilePath, getMatterDir, ALLOWED_EXTENSIONS, MAX_FILE_SIZE } from '../lib/storage.js';
```

Add multer config after the `staff` constant:

```typescript
const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => {
      const dir = '/tmp/iron-gavel-uploads';
      ensureDir(dir);
      cb(null, dir);
    },
    filename: (_req, file, cb) => {
      cb(null, `${Date.now()}-${file.originalname}`);
    },
  }),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ALLOWED_EXTENSIONS.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${ext} not allowed`));
    }
  },
});
```

Add the upload endpoint after the existing POST route:

```typescript
// POST /api/v1/documents/upload — multipart file upload
documentsRouter.post('/upload', ...staff, upload.single('file'), auditLog('CREATE', 'Document'), async (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: 'No file provided' });
    return;
  }

  const matterId = req.body.matterId;
  const category = req.body.category ?? 'General';

  if (!matterId) {
    // Clean up temp file
    fs.unlinkSync(req.file.path);
    res.status(400).json({ error: 'matterId is required' });
    return;
  }

  // Create document record
  const document = await prisma.document.create({
    data: {
      matterId,
      name: req.file.originalname,
      category,
      size: String(req.file.size),
      folder: req.body.folder,
    },
  });

  // Move file to permanent location
  const filePath = getFilePath(matterId, document.id, 1, req.file.originalname);
  ensureDir(getMatterDir(matterId));
  fs.renameSync(req.file.path, filePath);

  // Create version record
  await prisma.documentVersion.create({
    data: {
      documentId: document.id,
      version: 1,
      filePath,
      uploadedById: req.user!.userId,
    },
  });

  const result = await prisma.document.findUnique({
    where: { id: document.id },
    include: { versions: true },
  });

  res.status(201).json(result);
});
```

- [ ] **Step 2: Add upload test**

Add to `server/src/routes/documents.test.ts`:

```typescript
import path from 'path';
import fs from 'fs';

// Add this test inside the describe block:

it('POST /api/v1/documents/upload — uploads a file', async () => {
  // Create a temp test file
  const testFilePath = '/tmp/test-upload.pdf';
  fs.writeFileSync(testFilePath, 'fake pdf content for testing');

  const res = await request(app)
    .post('/api/v1/documents/upload')
    .set('Authorization', `Bearer ${token}`)
    .field('matterId', matterId)
    .field('category', 'Pleadings')
    .attach('file', testFilePath);

  expect(res.status).toBe(201);
  expect(res.body.name).toBe('test-upload.pdf');
  expect(res.body.versions).toBeDefined();
  expect(res.body.versions.length).toBe(1);
  expect(res.body.versions[0].filePath).toContain('matters/');

  // Clean up
  fs.unlinkSync(testFilePath);
  if (res.body.versions[0].filePath && fs.existsSync(res.body.versions[0].filePath)) {
    fs.unlinkSync(res.body.versions[0].filePath);
  }
});

it('POST /api/v1/documents/upload — rejects without matterId', async () => {
  const testFilePath = '/tmp/test-upload-no-matter.pdf';
  fs.writeFileSync(testFilePath, 'fake content');

  const res = await request(app)
    .post('/api/v1/documents/upload')
    .set('Authorization', `Bearer ${token}`)
    .attach('file', testFilePath);

  expect(res.status).toBe(400);
  fs.unlinkSync(testFilePath);
});
```

- [ ] **Step 3: Run tests inside Docker**

Expected: Original 5 + 2 new = 7 tests PASS.

- [ ] **Step 4: Commit**

```bash
cd /tmp/iron-gavel-deploy && git add server/src/routes/documents.router.ts server/src/routes/documents.test.ts
git commit -m "feat: add file upload endpoint with multer"
```

---

### Task 3: Add file download endpoint

**Files:**
- Modify: `server/src/routes/documents.router.ts`
- Modify: `server/src/routes/documents.test.ts`

- [ ] **Step 1: Add download endpoint**

Add import at top of documents router:

```typescript
import mime from 'mime-types';
```

Add after the upload endpoint:

```typescript
// GET /api/v1/documents/:id/download — stream file
documentsRouter.get('/:id/download', ...staff, async (req, res) => {
  const document = await prisma.document.findUnique({
    where: { id: req.params.id },
    include: { versions: { orderBy: { version: 'desc' }, take: 1 } },
  });

  if (!document) {
    res.status(404).json({ error: 'Document not found' });
    return;
  }

  const latestVersion = document.versions[0];
  if (!latestVersion?.filePath || !fs.existsSync(latestVersion.filePath)) {
    res.status(404).json({ error: 'File not found on disk' });
    return;
  }

  const contentType = mime.lookup(document.name) || 'application/octet-stream';
  res.setHeader('Content-Type', contentType);
  res.setHeader('Content-Disposition', `attachment; filename="${document.name}"`);

  const stream = fs.createReadStream(latestVersion.filePath);
  stream.pipe(res);
});
```

- [ ] **Step 2: Add download test**

Add to documents test file:

```typescript
it('GET /api/v1/documents/:id/download — downloads the file', async () => {
  // First upload a file
  const testFilePath = '/tmp/test-download.pdf';
  fs.writeFileSync(testFilePath, 'downloadable pdf content');

  const uploadRes = await request(app)
    .post('/api/v1/documents/upload')
    .set('Authorization', `Bearer ${token}`)
    .field('matterId', matterId)
    .field('category', 'Evidence')
    .attach('file', testFilePath);

  const docId = uploadRes.body.id;

  // Now download it
  const res = await request(app)
    .get(`/api/v1/documents/${docId}/download`)
    .set('Authorization', `Bearer ${token}`);

  expect(res.status).toBe(200);
  expect(res.headers['content-type']).toContain('application/pdf');
  expect(res.headers['content-disposition']).toContain('test-download.pdf');
  expect(res.text).toBe('downloadable pdf content');

  // Clean up
  fs.unlinkSync(testFilePath);
  const filePath = uploadRes.body.versions[0].filePath;
  if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
});

it('GET /api/v1/documents/:id/download — returns 404 for nonexistent', async () => {
  const res = await request(app)
    .get('/api/v1/documents/nonexistent/download')
    .set('Authorization', `Bearer ${token}`);

  expect(res.status).toBe(404);
});
```

- [ ] **Step 3: Run tests inside Docker**

Expected: 9 tests PASS.

- [ ] **Step 4: Commit**

```bash
cd /tmp/iron-gavel-deploy && git add server/src/routes/documents.router.ts server/src/routes/documents.test.ts
git commit -m "feat: add file download endpoint with streaming"
```

---

### Task 4: Add file versioning (re-upload to existing document)

**Files:**
- Modify: `server/src/routes/documents.router.ts`
- Modify: `server/src/routes/documents.test.ts`

- [ ] **Step 1: Add version upload endpoint**

Add after the download endpoint:

```typescript
// POST /api/v1/documents/:id/versions — upload new version of existing document
documentsRouter.post('/:id/versions', ...staff, upload.single('file'), auditLog('UPDATE', 'Document'), async (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: 'No file provided' });
    return;
  }

  const document = await prisma.document.findUnique({
    where: { id: req.params.id },
    include: { versions: { orderBy: { version: 'desc' }, take: 1 } },
  });

  if (!document) {
    fs.unlinkSync(req.file.path);
    res.status(404).json({ error: 'Document not found' });
    return;
  }

  const nextVersion = (document.versions[0]?.version ?? 0) + 1;
  const filePath = getFilePath(document.matterId, document.id, nextVersion, req.file.originalname);
  ensureDir(getMatterDir(document.matterId));
  fs.renameSync(req.file.path, filePath);

  const version = await prisma.documentVersion.create({
    data: {
      documentId: document.id,
      version: nextVersion,
      filePath,
      uploadedById: req.user!.userId,
    },
  });

  // Update document name and size if new file has different name
  await prisma.document.update({
    where: { id: document.id },
    data: {
      name: req.file.originalname,
      size: String(req.file.size),
    },
  });

  const result = await prisma.document.findUnique({
    where: { id: document.id },
    include: { versions: { orderBy: { version: 'desc' } } },
  });

  res.status(201).json(result);
});

// GET /api/v1/documents/:id/versions — list all versions
documentsRouter.get('/:id/versions', ...staff, async (req, res) => {
  const document = await prisma.document.findUnique({
    where: { id: req.params.id },
    include: { versions: { orderBy: { version: 'desc' } } },
  });

  if (!document) {
    res.status(404).json({ error: 'Document not found' });
    return;
  }

  res.json(document.versions);
});
```

- [ ] **Step 2: Add versioning tests**

Add to documents test file:

```typescript
it('POST /api/v1/documents/:id/versions — uploads a new version', async () => {
  // Upload initial file
  const file1 = '/tmp/test-v1.pdf';
  fs.writeFileSync(file1, 'version 1 content');

  const uploadRes = await request(app)
    .post('/api/v1/documents/upload')
    .set('Authorization', `Bearer ${token}`)
    .field('matterId', matterId)
    .field('category', 'Contracts')
    .attach('file', file1);

  const docId = uploadRes.body.id;

  // Upload version 2
  const file2 = '/tmp/test-v2.pdf';
  fs.writeFileSync(file2, 'version 2 content');

  const res = await request(app)
    .post(`/api/v1/documents/${docId}/versions`)
    .set('Authorization', `Bearer ${token}`)
    .attach('file', file2);

  expect(res.status).toBe(201);
  expect(res.body.versions.length).toBe(2);
  expect(res.body.versions[0].version).toBe(2);

  // Clean up files
  fs.unlinkSync(file1);
  fs.unlinkSync(file2);
  for (const v of res.body.versions) {
    if (v.filePath && fs.existsSync(v.filePath)) fs.unlinkSync(v.filePath);
  }
});

it('GET /api/v1/documents/:id/versions — lists all versions', async () => {
  // Upload a file first
  const file = '/tmp/test-versions-list.pdf';
  fs.writeFileSync(file, 'content');

  const uploadRes = await request(app)
    .post('/api/v1/documents/upload')
    .set('Authorization', `Bearer ${token}`)
    .field('matterId', matterId)
    .field('category', 'General')
    .attach('file', file);

  const res = await request(app)
    .get(`/api/v1/documents/${uploadRes.body.id}/versions`)
    .set('Authorization', `Bearer ${token}`);

  expect(res.status).toBe(200);
  expect(Array.isArray(res.body)).toBe(true);
  expect(res.body.length).toBe(1);

  fs.unlinkSync(file);
  if (res.body[0]?.filePath && fs.existsSync(res.body[0].filePath)) fs.unlinkSync(res.body[0].filePath);
});
```

- [ ] **Step 3: Run tests inside Docker**

Expected: 11 tests PASS.

- [ ] **Step 4: Commit**

```bash
cd /tmp/iron-gavel-deploy && git add server/src/routes/documents.router.ts server/src/routes/documents.test.ts
git commit -m "feat: add document versioning — upload new versions and list history"
```

---

### Task 5: Full validation — all tests

Run all server tests. Expected total: ~90 tests (84 existing + ~6 new file storage tests).

Fix any issues. Commit and push.
