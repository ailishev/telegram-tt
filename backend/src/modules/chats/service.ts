import { prisma } from '@/lib/prisma';

export async function createChat(userId: string, input: { type: 'private' | 'group' | 'channel'; title?: string; userIds: string[] }) {
  const memberIds = Array.from(new Set([userId, ...input.userIds]));
  return prisma.chat.create({
    data: {
      type: input.type,
      title: input.title,
      ownerId: userId,
      members: {
        create: memberIds.map((id) => ({ userId: id, role: id === userId ? 'owner' : 'member' })),
      },
    },
    include: { members: true },
  });
}

export async function listChats(userId: string) {
  return prisma.chatMember.findMany({
    where: { userId },
    include: {
      chat: {
        include: { messages: { orderBy: { createdAt: 'desc' }, take: 1 } },
      },
    },
    orderBy: { joinedAt: 'desc' },
  });
}
