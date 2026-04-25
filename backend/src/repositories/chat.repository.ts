import { ChatType, prisma } from '../lib/prisma.js';

export const chatRepository = {
  listForUser(userId: string) {
    return prisma.chat.findMany({
      where: { participants: { some: { userId } } },
      include: {
        participants: { include: { user: { select: { id: true, username: true, avatar: true } } } },
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: { updatedAt: 'desc' },
    });
  },
  findById(chatId: string, userId: string) {
    return prisma.chat.findFirst({
      where: { id: chatId, participants: { some: { userId } } },
      include: { participants: true },
    });
  },
  createPrivate(userA: string, userB: string) {
    return prisma.chat.create({
      data: {
        type: ChatType.PRIVATE,
        participants: {
          createMany: {
            data: [{ userId: userA }, { userId: userB }],
            skipDuplicates: true,
          },
        },
      },
    });
  },
  createGroup(title: string, ownerId: string, participantIds: string[]) {
    const uniqueIds = [...new Set([ownerId, ...participantIds])];
    return prisma.chat.create({
      data: {
        type: ChatType.GROUP,
        title,
        participants: {
          createMany: {
            data: uniqueIds.map((userId) => ({ userId, role: userId === ownerId ? 'owner' : 'member' })),
            skipDuplicates: true,
          },
        },
      },
    });
  },
};
