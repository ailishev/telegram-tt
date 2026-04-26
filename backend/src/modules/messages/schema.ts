import { z } from 'zod';

export const sendMessageSchema = z.object({
  chatId: z.string().regex(/^[0-9]+$/),
  content: z.string().min(1).max(4000),
  type: z.enum(['text', 'image', 'gift', 'system']).default('text'),
  replyToId: z.string().regex(/^[0-9]+$/).optional(),
  forwardFromId: z.string().regex(/^[0-9]+$/).optional(),
});

export const editMessageSchema = z.object({
  content: z.string().min(1).max(4000),
});
