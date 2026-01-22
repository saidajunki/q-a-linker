import { describe, it, expect } from 'vitest';
import { createReportSchema } from './report';

describe('createReportSchema', () => {
  const validUUID = '550e8400-e29b-41d4-a716-446655440000';

  it('有効なデータを受け入れる', () => {
    const result = createReportSchema.safeParse({
      threadId: validUUID,
      messageId: validUUID,
      reason: 'spam',
      description: 'スパムです',
    });
    expect(result.success).toBe(true);
  });

  it('messageIdはオプショナル', () => {
    const result = createReportSchema.safeParse({
      threadId: validUUID,
      reason: 'harassment',
    });
    expect(result.success).toBe(true);
  });

  it('descriptionはオプショナル', () => {
    const result = createReportSchema.safeParse({
      threadId: validUUID,
      reason: 'inappropriate',
    });
    expect(result.success).toBe(true);
  });

  it('全ての通報理由を受け入れる', () => {
    const reasons = ['spam', 'harassment', 'inappropriate', 'other'];
    for (const reason of reasons) {
      const result = createReportSchema.safeParse({
        threadId: validUUID,
        reason,
      });
      expect(result.success).toBe(true);
    }
  });

  it('無効な通報理由を拒否する', () => {
    const result = createReportSchema.safeParse({
      threadId: validUUID,
      reason: 'invalid',
    });
    expect(result.success).toBe(false);
  });

  it('descriptionが1000文字を超える場合を拒否する', () => {
    const result = createReportSchema.safeParse({
      threadId: validUUID,
      reason: 'other',
      description: 'a'.repeat(1001),
    });
    expect(result.success).toBe(false);
  });
});
