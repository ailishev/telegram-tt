import { getAuthUserId } from '@/lib/auth';
import { fail, ok } from '@/lib/http';
import { prisma } from '@/lib/prisma';

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const userId = await getAuthUserId();
  if (!userId) return fail('Unauthorized', 401);

  const membership = await prisma.chatMember.findUnique({ where: { userId_chatId: { userId, chatId: params.id } } });
  if (!membership) return fail('Forbidden', 403);

  const chat = await prisma.chat.findUnique({ where: { id: params.id }, include: { members: { include: { user: true } } } });
  if (!chat) return fail('Not found', 404);

  return ok({ chat });
}
