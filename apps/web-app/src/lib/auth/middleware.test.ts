import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { getAccessToken, authenticate, withAuth } from './middleware';
import * as jwt from './jwt';

// JWTモジュールをモック
vi.mock('./jwt', () => ({
  verifyAccessToken: vi.fn(),
}));

describe('middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAccessToken', () => {
    it('Bearerトークンを抽出する', () => {
      const request = new NextRequest('http://localhost/api/test', {
        headers: { Authorization: 'Bearer test-token-123' },
      });
      expect(getAccessToken(request)).toBe('test-token-123');
    });

    it('Authorizationヘッダーがない場合はnullを返す', () => {
      const request = new NextRequest('http://localhost/api/test');
      expect(getAccessToken(request)).toBeNull();
    });

    it('Bearer形式でない場合はnullを返す', () => {
      const request = new NextRequest('http://localhost/api/test', {
        headers: { Authorization: 'Basic dXNlcjpwYXNz' },
      });
      expect(getAccessToken(request)).toBeNull();
    });

    it('Bearerの後にスペースがある場合はトークン部分を返す', () => {
      const request = new NextRequest('http://localhost/api/test', {
        headers: { Authorization: 'Bearer token-with-space' },
      });
      expect(getAccessToken(request)).toBe('token-with-space');
    });
  });

  describe('authenticate', () => {
    it('有効なトークンでユーザー情報を返す', async () => {
      const mockPayload = { sub: 'user-123', email: 'test@example.com', role: 'asker' };
      vi.mocked(jwt.verifyAccessToken).mockResolvedValue(mockPayload);

      const request = new NextRequest('http://localhost/api/test', {
        headers: { Authorization: 'Bearer valid-token' },
      });

      const result = await authenticate(request);
      expect(result).toEqual(mockPayload);
      expect(jwt.verifyAccessToken).toHaveBeenCalledWith('valid-token');
    });

    it('トークンがない場合はnullを返す', async () => {
      const request = new NextRequest('http://localhost/api/test');
      const result = await authenticate(request);
      expect(result).toBeNull();
      expect(jwt.verifyAccessToken).not.toHaveBeenCalled();
    });

    it('無効なトークンの場合はnullを返す', async () => {
      vi.mocked(jwt.verifyAccessToken).mockResolvedValue(null);

      const request = new NextRequest('http://localhost/api/test', {
        headers: { Authorization: 'Bearer invalid-token' },
      });

      const result = await authenticate(request);
      expect(result).toBeNull();
    });
  });

  describe('withAuth', () => {
    it('認証成功時にハンドラーを実行する', async () => {
      const mockPayload = { sub: 'user-123', email: 'test@example.com', role: 'asker' };
      vi.mocked(jwt.verifyAccessToken).mockResolvedValue(mockPayload);

      const mockHandler = vi.fn().mockResolvedValue({ success: true });
      const wrappedHandler = withAuth(mockHandler);

      const request = new NextRequest('http://localhost/api/test', {
        headers: { Authorization: 'Bearer valid-token' },
      });

      const result = await wrappedHandler(request);
      expect(result).toEqual({ success: true });
      expect(mockHandler).toHaveBeenCalledWith(request, mockPayload);
    });

    it('認証失敗時に401を返す', async () => {
      vi.mocked(jwt.verifyAccessToken).mockResolvedValue(null);

      const mockHandler = vi.fn();
      const wrappedHandler = withAuth(mockHandler);

      const request = new NextRequest('http://localhost/api/test', {
        headers: { Authorization: 'Bearer invalid-token' },
      });

      const result = await wrappedHandler(request);
      expect(result.status).toBe(401);
      expect(mockHandler).not.toHaveBeenCalled();
    });

    it('トークンがない場合に401を返す', async () => {
      const mockHandler = vi.fn();
      const wrappedHandler = withAuth(mockHandler);

      const request = new NextRequest('http://localhost/api/test');

      const result = await wrappedHandler(request);
      expect(result.status).toBe(401);
      expect(mockHandler).not.toHaveBeenCalled();
    });
  });
});
