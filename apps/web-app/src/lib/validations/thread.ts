import { z } from 'zod';

export const createThreadSchema = z.object({
  body: z
    .string()
    .min(1, '質問を入力してください')
    .max(5000, '質問は5000文字以内で入力してください'),
});

export const createMessageSchema = z.object({
  body: z
    .string()
    .min(1, '回答を入力してください')
    .max(10000, '回答は10000文字以内で入力してください'),
});

export const threadQuerySchema = z.object({
  status: z.enum(['open', 'answering', 'answered', 'closed']).optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
});

export type CreateThreadInput = z.infer<typeof createThreadSchema>;
export type CreateMessageInput = z.infer<typeof createMessageSchema>;
export type ThreadQueryInput = z.infer<typeof threadQuerySchema>;
