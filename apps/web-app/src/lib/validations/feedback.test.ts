import { describe, it, expect } from 'vitest';
import { createFeedbackSchema } from './feedback';

describe('createFeedbackSchema', () => {
  const validUUID = '550e8400-e29b-41d4-a716-446655440000';

  it('有効なデータを受け入れる', () => {
    const result = createFeedbackSchema.safeParse({
      threadId: validUUID,
      messageId: validUUID,
      kind: 'thanks',
    });
    expect(result.success).toBe(true);
  });

  it('helpfulも受け入れる', () => {
    const result = createFeedbackSchema.safeParse({
      threadId: validUUID,
      messageId: validUUID,
      kind: 'helpful',
    });
    expect(result.success).toBe(true);
  });

  it('無効なUUIDを拒否する', () => {
    const result = createFeedbackSchema.safeParse({
      threadId: 'invalid',
      messageId: validUUID,
      kind: 'thanks',
    });
    expect(result.success).toBe(false);
  });

  it('無効なkindを拒否する', () => {
    const result = createFeedbackSchema.safeParse({
      threadId: validUUID,
      messageId: validUUID,
      kind: 'invalid',
    });
    expect(result.success).toBe(false);
  });

  it('必須フィールドがない場合を拒否する', () => {
    const result = createFeedbackSchema.safeParse({
      threadId: validUUID,
    });
    expect(result.success).toBe(false);
  });
});
