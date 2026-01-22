import { describe, it, expect } from 'vitest';
import { signupSchema, loginSchema, refreshSchema, logoutSchema } from './auth';

describe('auth validations', () => {
  describe('signupSchema', () => {
    it('有効な入力を受け入れる', () => {
      const input = {
        email: 'test@example.com',
        password: 'Password123',
        name: 'テストユーザー',
      };

      const result = signupSchema.safeParse(input);

      expect(result.success).toBe(true);
    });

    it('無効なメールアドレスを拒否する', () => {
      const input = {
        email: 'invalid-email',
        password: 'Password123',
        name: 'テストユーザー',
      };

      const result = signupSchema.safeParse(input);

      expect(result.success).toBe(false);
    });

    it('短すぎるパスワードを拒否する', () => {
      const input = {
        email: 'test@example.com',
        password: 'Pass1',
        name: 'テストユーザー',
      };

      const result = signupSchema.safeParse(input);

      expect(result.success).toBe(false);
    });

    it('英字のみのパスワードを拒否する', () => {
      const input = {
        email: 'test@example.com',
        password: 'PasswordOnly',
        name: 'テストユーザー',
      };

      const result = signupSchema.safeParse(input);

      expect(result.success).toBe(false);
    });

    it('数字のみのパスワードを拒否する', () => {
      const input = {
        email: 'test@example.com',
        password: '12345678',
        name: 'テストユーザー',
      };

      const result = signupSchema.safeParse(input);

      expect(result.success).toBe(false);
    });

    it('空の名前を拒否する', () => {
      const input = {
        email: 'test@example.com',
        password: 'Password123',
        name: '',
      };

      const result = signupSchema.safeParse(input);

      expect(result.success).toBe(false);
    });

    it('51文字以上の名前を拒否する', () => {
      const input = {
        email: 'test@example.com',
        password: 'Password123',
        name: 'a'.repeat(51),
      };

      const result = signupSchema.safeParse(input);

      expect(result.success).toBe(false);
    });
  });

  describe('loginSchema', () => {
    it('有効な入力を受け入れる', () => {
      const input = {
        email: 'test@example.com',
        password: 'anypassword',
      };

      const result = loginSchema.safeParse(input);

      expect(result.success).toBe(true);
    });

    it('無効なメールアドレスを拒否する', () => {
      const input = {
        email: 'invalid-email',
        password: 'anypassword',
      };

      const result = loginSchema.safeParse(input);

      expect(result.success).toBe(false);
    });

    it('空のパスワードを拒否する', () => {
      const input = {
        email: 'test@example.com',
        password: '',
      };

      const result = loginSchema.safeParse(input);

      expect(result.success).toBe(false);
    });
  });

  describe('refreshSchema', () => {
    it('有効な入力を受け入れる', () => {
      const input = {
        refreshToken: 'some-token',
      };

      const result = refreshSchema.safeParse(input);

      expect(result.success).toBe(true);
    });

    it('空のトークンを拒否する', () => {
      const input = {
        refreshToken: '',
      };

      const result = refreshSchema.safeParse(input);

      expect(result.success).toBe(false);
    });
  });

  describe('logoutSchema', () => {
    it('有効な入力を受け入れる', () => {
      const input = {
        refreshToken: 'some-token',
      };

      const result = logoutSchema.safeParse(input);

      expect(result.success).toBe(true);
    });

    it('空のトークンを拒否する', () => {
      const input = {
        refreshToken: '',
      };

      const result = logoutSchema.safeParse(input);

      expect(result.success).toBe(false);
    });
  });
});
