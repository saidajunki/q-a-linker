import { z } from 'zod';

export const inboxQuerySchema = z.object({
  status: z.enum(['notified', 'viewed', 'answering', 'answered', 'declined']).optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
});

export type InboxQueryInput = z.infer<typeof inboxQuerySchema>;
