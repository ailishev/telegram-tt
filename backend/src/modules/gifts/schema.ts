import { z } from 'zod';

export const sendGiftSchema = z.object({
  chatId: z.string().regex(/^[0-9]+$/),
  receiverId: z.string().regex(/^[0-9]+$/),
  giftId: z.string().regex(/^[0-9]+$/),
  message: z.string().max(1000).default('🎁 Gift'),
});
