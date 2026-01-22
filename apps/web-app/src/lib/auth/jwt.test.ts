import { describe, it, expect } from 'vitest';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} from './jwt';
import { UserRole } from '@prisma/client';

describe('jwt', () => {
  const testPayload = {
    sub: 'test-user-id',
    email: 'test@example.com',
    role: 'asker' as UserRole,
  };

  describe('generateAccessToken', () => {
    it('アクセストークンを生成できる', async () => {
      const token = await generateAccessToken(testPayload);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT形式
    });
  });

  describe('generateRefreshToken', () => {
    it('リフレッシュトークンと有効期限を生成できる', async () => {
      const { token, expiresAt } = await generateRefreshToken('test-user-id');

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
      expect(expiresAt).toBeInstanceOf(Date);
      expect(expiresAt.getTime()).toBeGreaterThan(Date.now());
    });
  });

  describe('verifyAccessToken', () => {
    it('有効なアクセストークンを検証できる', async () => {
      const token = await generateAccessToken(testPayload);
      const payload = await verifyAccessToken(token);

      expect(payload).not.toBeNull();
      expect(payload?.sub).toBe(testPayload.sub);
      expect(payload?.email).toBe(testPayload.email);
      expect(payload?.role).toBe(testPayload.role);
    });

    it('無効なトークンでnullを返す', async () => {
      const payload = await verifyAccessToken('invalid-token');

      expect(payload).toBeNull();
    });

    it('改ざんされたトークンでnullを返す', async () => {
      const token = await generateAccessToken(testPayload);
      const tamperedToken = token.slice(0, -5) + 'xxxxx';

      const payload = await verifyAccessToken(tamperedToken);

      expect(payload).toBeNull();
    });
  });

  describe('verifyRefreshToken', () => {
    it('有効なリフレッシュトークンを検証できる', async () => {
      const { token } = await generateRefreshToken('test-user-id');
      const payload = await verifyRefreshToken(token);

      expect(payload).not.toBeNull();
      expect(payload?.sub).toBe('test-user-id');
    });

    it('無効なトークンでnullを返す', async () => {
      const payload = await verifyRefreshToken('invalid-token');

      expect(payload).toBeNull();
    });

    it('アクセストークンをリフレッシュトークンとして検証するとnullを返す', async () => {
      const accessToken = await generateAccessToken(testPayload);
      const payload = await verifyRefreshToken(accessToken);

      expect(payload).toBeNull();
    });
  });
});
