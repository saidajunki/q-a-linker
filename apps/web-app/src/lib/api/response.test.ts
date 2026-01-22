import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import {
  successResponse,
  errorResponse,
  validationErrorResponse,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  conflictResponse,
  serverErrorResponse,
} from './response';

describe('response', () => {
  describe('successResponse', () => {
    it('デフォルトで200ステータスを返す', async () => {
      const response = successResponse({ message: 'ok' });
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toEqual({ message: 'ok' });
    });

    it('カスタムステータスを指定できる', async () => {
      const response = successResponse({ id: '123' }, 201);
      expect(response.status).toBe(201);
    });
  });

  describe('errorResponse', () => {
    it('エラーレスポンスを返す', async () => {
      const response = errorResponse('Bad Request', 'エラーメッセージ', 400);
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data).toEqual({
        error: 'Bad Request',
        message: 'エラーメッセージ',
      });
    });

    it('詳細情報を含めることができる', async () => {
      const details = [{ field: 'email', message: '無効なメール' }];
      const response = errorResponse('Bad Request', 'バリデーションエラー', 400, details);
      const data = await response.json();
      expect(data.details).toEqual(details);
    });
  });

  describe('validationErrorResponse', () => {
    it('Zodエラーからバリデーションエラーレスポンスを生成する', async () => {
      const schema = z.object({
        email: z.string().email('有効なメールアドレスを入力してください'),
        name: z.string().min(1, '名前を入力してください'),
      });

      const result = schema.safeParse({ email: 'invalid', name: '' });
      if (result.success) throw new Error('Should fail');

      const response = validationErrorResponse(result.error);
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Bad Request');
      expect(data.message).toBe('リクエストが不正です');
      expect(data.details).toHaveLength(2);
      expect(data.details[0].field).toBe('email');
      expect(data.details[1].field).toBe('name');
    });
  });

  describe('unauthorizedResponse', () => {
    it('401ステータスを返す', async () => {
      const response = unauthorizedResponse();
      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe('Unauthorized');
      expect(data.message).toBe('認証が必要です');
    });

    it('カスタムメッセージを指定できる', async () => {
      const response = unauthorizedResponse('トークンが無効です');
      const data = await response.json();
      expect(data.message).toBe('トークンが無効です');
    });
  });

  describe('forbiddenResponse', () => {
    it('403ステータスを返す', async () => {
      const response = forbiddenResponse();
      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.error).toBe('Forbidden');
      expect(data.message).toBe('アクセス権限がありません');
    });

    it('カスタムメッセージを指定できる', async () => {
      const response = forbiddenResponse('この操作は許可されていません');
      const data = await response.json();
      expect(data.message).toBe('この操作は許可されていません');
    });
  });

  describe('notFoundResponse', () => {
    it('404ステータスを返す', async () => {
      const response = notFoundResponse();
      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toBe('Not Found');
      expect(data.message).toBe('リソースが見つかりません');
    });

    it('カスタムメッセージを指定できる', async () => {
      const response = notFoundResponse('スレッドが見つかりません');
      const data = await response.json();
      expect(data.message).toBe('スレッドが見つかりません');
    });
  });

  describe('conflictResponse', () => {
    it('409ステータスを返す', async () => {
      const response = conflictResponse('このメールアドレスは既に登録されています');
      expect(response.status).toBe(409);
      const data = await response.json();
      expect(data.error).toBe('Conflict');
      expect(data.message).toBe('このメールアドレスは既に登録されています');
    });
  });

  describe('serverErrorResponse', () => {
    it('500ステータスを返す', async () => {
      const response = serverErrorResponse();
      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBe('Internal Server Error');
      expect(data.message).toBe('サーバーエラーが発生しました');
    });

    it('カスタムメッセージを指定できる', async () => {
      const response = serverErrorResponse('データベース接続エラー');
      const data = await response.json();
      expect(data.message).toBe('データベース接続エラー');
    });
  });
});
