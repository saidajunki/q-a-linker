import { z } from 'zod';

export const updateProfileSchema = z.object({
  name: z.string().min(1, '名前を入力してください').max(100, '名前は100文字以内で入力してください').optional(),
});

export const updateResponderProfileSchema = z.object({
  expertiseTags: z.array(z.string().max(50)).max(10, 'タグは10個以内で指定してください').optional(),
  levelPreference: z.enum(['beginner', 'intermediate', 'advanced']).optional().nullable(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type UpdateResponderProfileInput = z.infer<typeof updateResponderProfileSchema>;
