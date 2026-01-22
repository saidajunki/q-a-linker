import { z } from 'zod';

export const createReportSchema = z.object({
  threadId: z.string().uuid('有効なスレッドIDを指定してください'),
  messageId: z.string().uuid('有効なメッセージIDを指定してください').optional(),
  reason: z.enum(['spam', 'harassment', 'inappropriate', 'other'], {
    errorMap: () => ({ message: '有効な通報理由を指定してください' }),
  }),
  description: z.string().max(1000, '説明は1000文字以内で入力してください').optional(),
});

export type CreateReportInput = z.infer<typeof createReportSchema>;
