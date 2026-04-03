import { Router } from 'express';
import { z } from 'zod';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import mime from 'mime-types';
import { prisma } from '../lib/prisma.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { auditLog } from '../middleware/auditLog.js';
import {
  ensureDir,
  getFilePath,
  ALLOWED_EXTENSIONS,
  MAX_FILE_SIZE,
} from '../lib/storage.js';

export const documentsRouter = Router();

const staff = [authenticate, authorize('Admin', 'Attorney', 'Paralegal')];

const createSchema = z.object({
  matterId: z.string().min(1),
  name: z.string().min(1),
  category: z.string().min(1),
  size: z.string().default('0'),
  folder: z.string().optional(),
  batesNumber: z.string().optional(),
  isPrivileged: z.boolean().default(false),
  privilegeReason: z.string().optional(),
  discoveryStatus: z.string().optional(),
  sharedWithClient: z.boolean().default(false),
});

const updateSchema = createSchema.partial();

// Multer configuration — temp staging area before permanent placement
const upload = multer({
  storage: multer.diskStorage({
    destination: '/tmp/iron-gavel-uploads',
    filename: (_req, file, cb) => {
      const unique = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      cb(null, `${unique}${path.extname(file.originalname).toLowerCase()}`);
    },
  }),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ALLOWED_EXTENSIONS.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`File type not allowed: ${ext}`));
    }
  },
});

// 1. GET / — list documents
documentsRouter.get('/', ...staff, async (req, res) => {
  const { matterId } = req.query;
  const documents = await prisma.document.findMany({
    where: matterId ? { matterId: matterId as string } : undefined,
    orderBy: { createdAt: 'desc' },
  });
  res.json(documents);
});

// 2. POST / — create metadata record
documentsRouter.post('/', ...staff, auditLog('CREATE', 'Document'), async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
    return;
  }
  const document = await prisma.document.create({
    data: parsed.data,
  });
  res.status(201).json(document);
});

// 3. POST /upload — upload a file and create Document + DocumentVersion records
// MUST come before /:id routes so Express doesn't interpret "upload" as an id
documentsRouter.post(
  '/upload',
  ...staff,
  upload.single('file'),
  async (req, res) => {
    const { matterId, category } = req.body as { matterId?: string; category?: string };

    if (!matterId) {
      // Clean up temp file if it was saved
      if (req.file) fs.unlink(req.file.path, () => {});
      res.status(400).json({ error: 'matterId is required' });
      return;
    }

    if (!req.file) {
      res.status(400).json({ error: 'file is required' });
      return;
    }

    const userId = (req as any).user?.userId ?? 'unknown';
    const originalName = req.file.originalname;
    const tempPath = req.file.path;
    const fileSize = String(req.file.size);

    // Create Document record first (we need the id for the file path)
    const document = await prisma.document.create({
      data: {
        matterId,
        name: originalName,
        category: category ?? 'Uncategorized',
        size: fileSize,
      },
    });

    // Move file from temp to permanent storage
    const permanentPath = getFilePath(matterId, document.id, 1, originalName);
    ensureDir(path.dirname(permanentPath));
    fs.renameSync(tempPath, permanentPath);

    // Update document with filePath
    await prisma.document.update({
      where: { id: document.id },
      data: { filePath: permanentPath },
    });

    // Create DocumentVersion record (version 1)
    await prisma.documentVersion.create({
      data: {
        documentId: document.id,
        version: 1,
        filePath: permanentPath,
        uploadedById: userId,
      },
    });

    // Return document with versions
    const result = await prisma.document.findUnique({
      where: { id: document.id },
      include: { versions: true },
    });

    res.status(201).json(result);
  },
);

// 4. GET /:id — get single document
documentsRouter.get('/:id', ...staff, async (req, res) => {
  const document = await prisma.document.findUnique({
    where: { id: req.params.id },
    include: { versions: true },
  });
  if (!document) {
    res.status(404).json({ error: 'Document not found' });
    return;
  }
  res.json(document);
});

// 5. GET /:id/download — stream file to client
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
  if (!latestVersion) {
    res.status(404).json({ error: 'No file version found for this document' });
    return;
  }

  const filePath = latestVersion.filePath;
  if (!fs.existsSync(filePath)) {
    res.status(404).json({ error: 'File not found on disk' });
    return;
  }

  const contentType = mime.lookup(filePath) || 'application/octet-stream';
  res.setHeader('Content-Type', contentType);
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="${encodeURIComponent(document.name)}"`,
  );

  fs.createReadStream(filePath).pipe(res);
});

// 6. PUT /:id — update metadata
documentsRouter.put('/:id', ...staff, auditLog('UPDATE', 'Document'), async (req, res) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
    return;
  }
  const existing = await prisma.document.findUnique({ where: { id: req.params.id } });
  if (!existing) {
    res.status(404).json({ error: 'Document not found' });
    return;
  }
  const document = await prisma.document.update({
    where: { id: req.params.id },
    data: parsed.data,
  });
  res.json(document);
});

// 6. DELETE /:id
documentsRouter.delete('/:id', ...staff, auditLog('DELETE', 'Document'), async (req, res) => {
  const existing = await prisma.document.findUnique({ where: { id: req.params.id } });
  if (!existing) {
    res.status(404).json({ error: 'Document not found' });
    return;
  }
  await prisma.document.delete({ where: { id: req.params.id } });
  res.json({ message: 'Document deleted' });
});
