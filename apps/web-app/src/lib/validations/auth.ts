import { z } from 'zod';

export const signupSchema = z.object({
  email: z.string().email('有効なメールアドレスを入力してください'),
  password: z
    .string()
    .min(8, 'パスワードは8文字以上で入力してください')
    .regex(/[a-zA-Z]/, 'パスワードには英字を含めてください')
    .regex(/[0-9]/, 'パスワードには数字を含めてください'),
  name: z
    .string()
    .min(1, '名前を入力してください')
    .max(50, '名前は50文字以内で入力してください'),
  role: z.enum(['asker', 'responder'], {
    message: 'roleはaskerまたはresponderを指定してください',
  }),
});

export const loginSchema = z.object({
  email: z.string().email('有効なメールアドレスを入力してください'),
  password: z.string().min(1, 'パスワードを入力してください'),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'リフレッシュトークンを入力してください'),
});

export const logoutSchema = z.object({
  refreshToken: z.string().min(1, 'リフレッシュトークンを入力してください'),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshInput = z.infer<typeof refreshSchema>;
export type LogoutInput = z.infer<typeof logoutSchema>;
