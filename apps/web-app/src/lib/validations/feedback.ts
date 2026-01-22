import { z } from 'zod';

export const createFeedbackSchema = z.object({
  threadId: z.string().uuid('有効なスレッドIDを指定してください'),
  messageId: z.string().uuid('有効なメッセージIDを指定してください'),
  kind: z.enum(['thanks', 'helpful'], {
    errorMap: () => ({ message: '評価の種類はthanksまたはhelpfulを指定してください' }),
  }),
});

export type CreateFeedbackInput = z.infer<typeof createFeedbackSchema>;
