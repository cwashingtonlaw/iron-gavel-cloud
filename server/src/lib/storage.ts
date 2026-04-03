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
