import { z } from 'zod';

export const sendMessageSchema = z.object({
  chatId: z.string().cuid(),
  content: z.string().min(1).max(4000),
  type: z.enum(['text', 'image', 'gift', 'system']).default('text'),
  replyToId: z.string().cuid().optional(),
  forwardFromId: z.string().cuid().optional(),
});

export const editMessageSchema = z.object({
  content: z.string().min(1).max(4000),
});
