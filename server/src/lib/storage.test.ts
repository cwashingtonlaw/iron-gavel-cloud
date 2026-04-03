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
