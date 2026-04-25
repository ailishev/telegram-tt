import { MessageType, prisma } from '../lib/prisma.js';

export const messageRepository = {
  list(chatId: string, limit = 100) {
    return prisma.message.findMany({
      where: { chatId },
      orderBy: { createdAt: 'asc' },
      take: limit,
    });
  },
  async create(data: { chatId: string; senderId: string; content: string; type?: MessageType }) {
    const message = await prisma.message.create({
      data: {
        chatId: data.chatId,
        senderId: data.senderId,
        content: data.content,
        type: data.type ?? MessageType.TEXT,
      },
    });

    await prisma.chat.update({ where: { id: data.chatId }, data: { updatedAt: new Date() } });

    return message;
  },
};
