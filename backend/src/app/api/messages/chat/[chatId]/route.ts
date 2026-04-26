import { getAuthUserId } from '@/lib/auth';
import { fail, ok } from '@/lib/http';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request, { params }: { params: { chatId: string } }) {
  const userId = await getAuthUserId();
  if (!userId) return fail('Unauthorized', 401);

  const member = await prisma.chatMember.findUnique({ where: { userId_chatId: { userId, chatId: params.chatId } } });
  if (!member) return fail('Forbidden', 403);

  const url = new URL(req.url);
  const cursor = url.searchParams.get('cursor');
  const take = Math.min(Number(url.searchParams.get('take') || '30'), 100);

  const messages = await prisma.message.findMany({
    where: { chatId: params.chatId },
    orderBy: { createdAt: 'desc' },
    take,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
  });

  return ok({ messages, nextCursor: messages.length === take ? messages[messages.length - 1]?.id : undefined });
}
