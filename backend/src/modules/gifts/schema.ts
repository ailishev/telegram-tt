import { z } from 'zod';

export const sendGiftSchema = z.object({
  chatId: z.string().cuid(),
  receiverId: z.string().cuid(),
  giftId: z.string().cuid(),
  message: z.string().max(1000).default('🎁 Gift'),
});
