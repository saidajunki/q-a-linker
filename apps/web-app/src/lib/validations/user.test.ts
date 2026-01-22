import { describe, it, expect } from 'vitest';
import { updateProfileSchema, updateResponderProfileSchema } from './user';

describe('updateProfileSchema', () => {
  it('有効なデータを受け入れる', () => {
    const result = updateProfileSchema.safeParse({ name: 'テストユーザー' });
    expect(result.success).toBe(true);
  });

  it('空のオブジェクトを受け入れる', () => {
    const result = updateProfileSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('空の名前を拒否する', () => {
    const result = updateProfileSchema.safeParse({ name: '' });
    expect(result.success).toBe(false);
  });

  it('100文字を超える名前を拒否する', () => {
    const result = updateProfileSchema.safeParse({ name: 'a'.repeat(101) });
    expect(result.success).toBe(false);
  });
});

describe('updateResponderProfileSchema', () => {
  it('有効なデータを受け入れる', () => {
    const result = updateResponderProfileSchema.safeParse({
      expertiseTags: ['React', 'TypeScript'],
      levelPreference: 'beginner',
    });
    expect(result.success).toBe(true);
  });

  it('空のオブジェクトを受け入れる', () => {
    const result = updateResponderProfileSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('全てのlevelPreferenceを受け入れる', () => {
    const levels = ['beginner', 'intermediate', 'advanced'];
    for (const level of levels) {
      const result = updateResponderProfileSchema.safeParse({ levelPreference: level });
      expect(result.success).toBe(true);
    }
  });

  it('nullのlevelPreferenceを受け入れる', () => {
    const result = updateResponderProfileSchema.safeParse({ levelPreference: null });
    expect(result.success).toBe(true);
  });

  it('10個を超えるタグを拒否する', () => {
    const result = updateResponderProfileSchema.safeParse({
      expertiseTags: Array(11).fill('tag'),
    });
    expect(result.success).toBe(false);
  });

  it('50文字を超えるタグを拒否する', () => {
    const result = updateResponderProfileSchema.safeParse({
      expertiseTags: ['a'.repeat(51)],
    });
    expect(result.success).toBe(false);
  });
});
