import { prisma } from '@/lib/prisma';
import { sendMessage } from '@/modules/messages/service';

export async function sendGift(userId: string, input: { chatId: string; receiverId: string; giftId: string; message: string }) {
  const message = await sendMessage(userId, {
    chatId: input.chatId,
    content: input.message,
    type: 'gift',
  });

  const userGift = await prisma.userGift.create({
    data: {
      senderId: userId,
      receiverId: input.receiverId,
      giftId: input.giftId,
      messageId: message.id,
    },
    include: { gift: true },
  });

  return { message, userGift };
}
