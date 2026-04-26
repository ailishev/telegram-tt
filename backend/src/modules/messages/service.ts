import { prisma } from '@/lib/prisma';
import { mapMessage, type MessageMapperDTO } from '@/lib/mappers/message.mapper';
import { toBigIntId } from '@/lib/mappers/id';

export async function sendMessage(userId: string, input: {
  chatId: string;
  content: string;
  type: 'text' | 'image' | 'gift' | 'system';
  replyToId?: string;
  forwardFromId?: string;
}): Promise<MessageMapperDTO> {
  if (!input.chatId) {
    throw new Error('chatId is required');
  }
  if (!userId) {
    throw new Error('senderId is required');
  }

  const chatId = toBigIntId(input.chatId, 'chatId');
  const senderId = toBigIntId(userId, 'senderId');
  const replyToId = input.replyToId ? toBigIntId(input.replyToId, 'replyToId') : undefined;
  const forwardFromId = input.forwardFromId ? toBigIntId(input.forwardFromId, 'forwardFromId') : undefined;

  const member = await prisma.chatMember.findUnique({ where: { userId_chatId: { userId: senderId, chatId } } });
  if (!member) throw new Error('Access denied');

  const message = await prisma.message.create({
    data: {
      chatId,
      senderId,
      content: input.content,
      type: input.type,
      replyToId,
      forwardFromId,
    },
  });

  await prisma.chatMember.updateMany({
    where: { chatId, NOT: { userId: senderId } },
    data: { unread: { increment: 1 } },
  });

  return mapMessage(message);
}
