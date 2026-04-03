import { Router } from 'express';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';

export const adminRouter = Router();
const adminOnly = [authenticate, authorize('Admin')];

const BACKUP_DIR = process.env.BACKUP_DIR ?? '/data/iron-gavel/backups';

adminRouter.post('/backup', ...adminOnly, async (_req, res) => {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `pg_dump_${timestamp}.sql`;
    const filePath = path.join(BACKUP_DIR, filename);

    fs.mkdirSync(BACKUP_DIR, { recursive: true });

    const dbUrl = process.env.DATABASE_URL ?? '';
    execSync(`pg_dump "${dbUrl}" > "${filePath}"`, { stdio: 'pipe' });

    res.json({ filename, path: filePath });
  } catch (err: any) {
    res.status(500).json({ error: 'Backup failed', details: err.message });
  }
});

adminRouter.get('/backups', ...adminOnly, async (_req, res) => {
  try {
    if (!fs.existsSync(BACKUP_DIR)) { res.json([]); return; }
    const files = fs.readdirSync(BACKUP_DIR)
      .filter(f => f.endsWith('.sql'))
      .sort()
      .reverse();
    res.json(files);
  } catch {
    res.json([]);
  }
});
