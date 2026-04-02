import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword, generateAccessToken, generateRefreshToken, verifyAccessToken } from './auth.service.js';

describe('auth.service', () => {
  describe('password hashing', () => {
    it('hashes a password and verifies it', async () => {
      const hash = await hashPassword('mypassword');
      expect(hash).not.toBe('mypassword');
      expect(await verifyPassword('mypassword', hash)).toBe(true);
    });

    it('rejects wrong password', async () => {
      const hash = await hashPassword('mypassword');
      expect(await verifyPassword('wrongpassword', hash)).toBe(false);
    });
  });

  describe('JWT tokens', () => {
    it('generates and verifies an access token', () => {
      const token = generateAccessToken({ userId: 'USER_1', role: 'Admin' });
      const payload = verifyAccessToken(token);
      expect(payload.userId).toBe('USER_1');
      expect(payload.role).toBe('Admin');
    });

    it('generates a refresh token', () => {
      const token = generateRefreshToken({ userId: 'USER_1', sessionId: 'sess_1' });
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);
    });

    it('rejects an invalid access token', () => {
      expect(() => verifyAccessToken('invalid.token.here')).toThrow();
    });
  });
});
