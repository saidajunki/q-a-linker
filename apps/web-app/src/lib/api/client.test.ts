import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { setToken, setRefreshToken, clearTokens, authApi, threadApi, feedbackApi, responderApi } from './client';

// localStorageのモック
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
  };
})();

// fetchのモック
const mockFetch = vi.fn();

describe('API Client', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', localStorageMock);
    vi.stubGlobal('fetch', mockFetch);
    localStorageMock.clear();
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('Token management', () => {
    it('setTokenでアクセストークンを保存する', () => {
      setToken('test-token');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('accessToken', 'test-token');
    });

    it('setRefreshTokenでリフレッシュトークンを保存する', () => {
      setRefreshToken('refresh-token');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('refreshToken', 'refresh-token');
    });

    it('clearTokensでトークンをクリアする', () => {
      clearTokens();
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('accessToken');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('refreshToken');
    });
  });

  describe('authApi', () => {
    it('signupでユーザー登録APIを呼び出す', async () => {
      const mockResponse = {
        user: { id: '1', email: 'test@example.com', name: 'Test' },
        accessToken: 'token',
        refreshToken: 'refresh',
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await authApi.signup('test@example.com', 'password123', 'Test');
      
      expect(mockFetch).toHaveBeenCalledWith('/api/auth/signup', expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ email: 'test@example.com', password: 'password123', name: 'Test' }),
      }));
      expect(result.data).toEqual(mockResponse);
    });

    it('loginでログインAPIを呼び出す', async () => {
      const mockResponse = {
        user: { id: '1', email: 'test@example.com', name: 'Test' },
        accessToken: 'token',
        refreshToken: 'refresh',
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await authApi.login('test@example.com', 'password123');
      
      expect(mockFetch).toHaveBeenCalledWith('/api/auth/login', expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ email: 'test@example.com', password: 'password123' }),
      }));
      expect(result.data).toEqual(mockResponse);
    });

    it('meでユーザー情報取得APIを呼び出す', async () => {
      const mockResponse = { user: { id: '1', email: 'test@example.com', name: 'Test', role: 'asker' } };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await authApi.me();
      
      // トークンがない場合でもAPIは呼び出される
      expect(mockFetch).toHaveBeenCalledWith('/api/auth/me', expect.any(Object));
      expect(result.data).toEqual(mockResponse);
    });
  });

  describe('threadApi', () => {
    it('createで質問投稿APIを呼び出す', async () => {
      const mockResponse = {
        thread: { id: '1', title: 'Test', status: 'open' },
        message: { id: '1', body: 'Test question' },
        aiArtifact: { outputJson: {} },
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await threadApi.create('Test question');
      
      expect(mockFetch).toHaveBeenCalledWith('/api/threads', expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ body: 'Test question' }),
      }));
      expect(result.data).toEqual(mockResponse);
    });

    it('listでスレッド一覧APIを呼び出す', async () => {
      const mockResponse = { threads: [], total: 0 };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      await threadApi.list({ status: 'open', limit: 10 });
      
      // offset=0は含まれない（実装の動作に合わせる）
      expect(mockFetch).toHaveBeenCalledWith('/api/threads?status=open&limit=10', expect.any(Object));
    });

    it('listでパラメータなしの場合はクエリなしで呼び出す', async () => {
      const mockResponse = { threads: [], total: 0 };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      await threadApi.list();
      
      expect(mockFetch).toHaveBeenCalledWith('/api/threads', expect.any(Object));
    });

    it('getでスレッド詳細APIを呼び出す', async () => {
      const mockResponse = {
        thread: { id: '1', askerId: '1', title: 'Test', status: 'open', category: 'Tech', estimatedLevel: 'beginner' },
        messages: [],
        mergedAnswer: null,
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await threadApi.get('thread-123');
      
      expect(mockFetch).toHaveBeenCalledWith('/api/threads/thread-123', expect.any(Object));
      expect(result.data).toEqual(mockResponse);
    });

    it('postMessageでメッセージ投稿APIを呼び出す', async () => {
      const mockResponse = {
        message: { id: '1', body: 'Answer', type: 'answer' },
        simplifiedMessage: null,
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      await threadApi.postMessage('thread-123', 'Answer');
      
      expect(mockFetch).toHaveBeenCalledWith('/api/threads/thread-123/messages', expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ body: 'Answer' }),
      }));
    });

    it('closeでスレッドクローズAPIを呼び出す', async () => {
      const mockResponse = { thread: { id: '1', status: 'closed' } };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      await threadApi.close('thread-123');
      
      expect(mockFetch).toHaveBeenCalledWith('/api/threads/thread-123/close', expect.objectContaining({
        method: 'POST',
      }));
    });
  });

  describe('feedbackApi', () => {
    it('createで評価送信APIを呼び出す', async () => {
      const mockResponse = { feedback: { id: '1' } };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      await feedbackApi.create('thread-123', 'message-456', 'thanks');
      
      expect(mockFetch).toHaveBeenCalledWith('/api/feedback', expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ threadId: 'thread-123', messageId: 'message-456', kind: 'thanks' }),
      }));
    });
  });

  describe('responderApi', () => {
    it('inboxで受信箱APIを呼び出す', async () => {
      const mockResponse = { assignments: [], total: 0 };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      await responderApi.inbox({ status: 'notified' });
      
      expect(mockFetch).toHaveBeenCalledWith('/api/responder/inbox?status=notified', expect.any(Object));
    });

    it('viewで閲覧済みAPIを呼び出す', async () => {
      const mockResponse = { assignment: { id: '1', status: 'viewed' } };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      await responderApi.view('assignment-123');
      
      expect(mockFetch).toHaveBeenCalledWith('/api/responder/inbox/assignment-123/view', expect.objectContaining({
        method: 'POST',
      }));
    });

    it('declineで辞退APIを呼び出す', async () => {
      const mockResponse = { assignment: { id: '1', status: 'declined' } };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      await responderApi.decline('assignment-123');
      
      expect(mockFetch).toHaveBeenCalledWith('/api/responder/inbox/assignment-123/decline', expect.objectContaining({
        method: 'POST',
      }));
    });
  });

  describe('Error handling', () => {
    it('APIエラー時にエラーレスポンスを返す', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Bad Request', message: 'Invalid input' }),
      });

      const result = await authApi.login('test@example.com', 'wrong');
      
      expect(result.error).toBe('Bad Request');
      expect(result.message).toBe('Invalid input');
    });

    it('ネットワークエラー時にエラーレスポンスを返す', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await authApi.login('test@example.com', 'password');
      
      expect(result.error).toBe('Network Error');
      expect(result.message).toBe('ネットワークエラーが発生しました');
    });
  });
});
