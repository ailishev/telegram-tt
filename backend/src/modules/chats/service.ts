import { prisma } from '@/lib/prisma';
import { toBigIntId } from '@/lib/mappers/id';

export async function createChat(userId: string, input: { type: 'private' | 'group' | 'channel'; title?: string; userIds: string[] }) {
  const ownerId = toBigIntId(userId, 'ownerId');
  const memberIds = Array.from(new Set([ownerId.toString(), ...input.userIds]));
  return prisma.chat.create({
    data: {
      type: input.type,
      title: input.title,
      ownerId,
      members: {
        create: memberIds.map((id) => {
          const mappedUserId = toBigIntId(id, 'member.userId');
          return { userId: mappedUserId, role: mappedUserId === ownerId ? 'owner' : 'member' as const };
        }),
      },
    },
    include: { members: true },
  });
}

export async function listChats(userId: string) {
  const mappedUserId = toBigIntId(userId, 'userId');
  return prisma.chatMember.findMany({
    where: { userId: mappedUserId },
    include: {
      chat: {
        include: { messages: { orderBy: { createdAt: 'desc' }, take: 1 } },
      },
    },
    orderBy: { joinedAt: 'desc' },
  });
}
