import { describe, it, expect } from 'vitest';
import { inboxQuerySchema } from './responder';

describe('inboxQuerySchema', () => {
  it('デフォルト値が設定される', () => {
    const result = inboxQuerySchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(20);
      expect(result.data.offset).toBe(0);
      expect(result.data.status).toBeUndefined();
    }
  });

  it('有効なstatusを受け入れる', () => {
    const statuses = ['notified', 'viewed', 'answering', 'answered', 'declined'];
    for (const status of statuses) {
      const result = inboxQuerySchema.safeParse({ status });
      expect(result.success).toBe(true);
    }
  });

  it('無効なstatusを拒否する', () => {
    const result = inboxQuerySchema.safeParse({ status: 'invalid' });
    expect(result.success).toBe(false);
  });

  it('limitの範囲を検証する', () => {
    expect(inboxQuerySchema.safeParse({ limit: 0 }).success).toBe(false);
    expect(inboxQuerySchema.safeParse({ limit: 1 }).success).toBe(true);
    expect(inboxQuerySchema.safeParse({ limit: 100 }).success).toBe(true);
    expect(inboxQuerySchema.safeParse({ limit: 101 }).success).toBe(false);
  });

  it('offsetは0以上', () => {
    expect(inboxQuerySchema.safeParse({ offset: -1 }).success).toBe(false);
    expect(inboxQuerySchema.safeParse({ offset: 0 }).success).toBe(true);
  });
});
