import { prisma } from '@/lib/prisma';
import { toMessageDTO, type MessageDTO } from '@/lib/mappers/message';

export async function sendMessage(userId: string, input: {
  chatId: string;
  content: string;
  type: 'text' | 'image' | 'gift' | 'system';
  replyToId?: string;
  forwardFromId?: string;
}): Promise<MessageDTO> {
  if (!input.chatId) {
    throw new Error('chatId is required');
  }
  if (!userId) {
    throw new Error('senderId is required');
  }

  const member = await prisma.chatMember.findUnique({ where: { userId_chatId: { userId, chatId: input.chatId } } });
  if (!member) throw new Error('Access denied');

  const message = await prisma.message.create({
    data: {
      chatId: input.chatId,
      senderId: userId,
      content: input.content,
      type: input.type,
      replyToId: input.replyToId,
      forwardFromId: input.forwardFromId,
    },
  });

  await prisma.chatMember.updateMany({
    where: { chatId: input.chatId, NOT: { userId } },
    data: { unread: { increment: 1 } },
  });

  return toMessageDTO(message);
}
