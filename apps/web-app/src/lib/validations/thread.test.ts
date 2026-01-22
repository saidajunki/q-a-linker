import { describe, it, expect } from 'vitest';
import { createThreadSchema, createMessageSchema, threadQuerySchema } from './thread';

describe('thread validations', () => {
  describe('createThreadSchema', () => {
    it('有効な質問を受け入れる', () => {
      const input = { body: 'Reactでstateが更新されないのですが、どうすればいいですか？' };
      const result = createThreadSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('空の質問を拒否する', () => {
      const input = { body: '' };
      const result = createThreadSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('5000文字を超える質問を拒否する', () => {
      const input = { body: 'a'.repeat(5001) };
      const result = createThreadSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('5000文字ちょうどの質問を受け入れる', () => {
      const input = { body: 'a'.repeat(5000) };
      const result = createThreadSchema.safeParse(input);
      expect(result.success).toBe(true);
    });
  });

  describe('createMessageSchema', () => {
    it('有効な回答を受け入れる', () => {
      const input = { body: 'useStateの更新は非同期で行われます。' };
      const result = createMessageSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('空の回答を拒否する', () => {
      const input = { body: '' };
      const result = createMessageSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('10000文字を超える回答を拒否する', () => {
      const input = { body: 'a'.repeat(10001) };
      const result = createMessageSchema.safeParse(input);
      expect(result.success).toBe(false);
    });
  });

  describe('threadQuerySchema', () => {
    it('デフォルト値が設定される', () => {
      const input = {};
      const result = threadQuerySchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(20);
        expect(result.data.offset).toBe(0);
      }
    });

    it('有効なstatusを受け入れる', () => {
      const statuses = ['open', 'answering', 'answered', 'closed'];
      for (const status of statuses) {
        const result = threadQuerySchema.safeParse({ status });
        expect(result.success).toBe(true);
      }
    });

    it('無効なstatusを拒否する', () => {
      const input = { status: 'invalid' };
      const result = threadQuerySchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('limitの範囲を検証する', () => {
      expect(threadQuerySchema.safeParse({ limit: 0 }).success).toBe(false);
      expect(threadQuerySchema.safeParse({ limit: 1 }).success).toBe(true);
      expect(threadQuerySchema.safeParse({ limit: 100 }).success).toBe(true);
      expect(threadQuerySchema.safeParse({ limit: 101 }).success).toBe(false);
    });

    it('offsetは0以上を受け入れる', () => {
      expect(threadQuerySchema.safeParse({ offset: -1 }).success).toBe(false);
      expect(threadQuerySchema.safeParse({ offset: 0 }).success).toBe(true);
      expect(threadQuerySchema.safeParse({ offset: 100 }).success).toBe(true);
    });
  });
});
