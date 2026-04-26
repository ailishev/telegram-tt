import { prisma } from '@/lib/prisma';

export async function sendMessage(userId: string, input: {
  chatId: string;
  content: string;
  type: 'text' | 'image' | 'gift' | 'system';
  replyToId?: string;
  forwardFromId?: string;
}) {
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

  return message;
}
