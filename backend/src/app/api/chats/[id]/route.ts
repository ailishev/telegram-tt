import { getAuthUserId } from '@/lib/auth';
import { fail, ok } from '@/lib/http';
import { prisma } from '@/lib/prisma';
import { toBigIntId } from '@/lib/mappers/id';

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const userId = await getAuthUserId();
  if (!userId) return fail('Unauthorized', 401);
  const mappedUserId = toBigIntId(userId, 'userId');
  const chatId = toBigIntId(params.id, 'chatId');

  const membership = await prisma.chatMember.findUnique({ where: { userId_chatId: { userId: mappedUserId, chatId } } });
  if (!membership) return fail('Forbidden', 403);

  const chat = await prisma.chat.findUnique({ where: { id: chatId }, include: { members: { include: { user: true } } } });
  if (!chat) return fail('Not found', 404);

  return ok({ chat });
}
