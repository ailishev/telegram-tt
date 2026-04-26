import { getAuthUserId } from '@/lib/auth';
import { fail, ok } from '@/lib/http';
import { prisma } from '@/lib/prisma';
import { toBigIntId } from '@/lib/mappers/id';
import { mapMessage } from '@/lib/mappers/message.mapper';

export async function GET(req: Request, { params }: { params: { chatId: string } }) {
  const userId = await getAuthUserId();
  if (!userId) return fail('Unauthorized', 401);
  const mappedUserId = toBigIntId(userId, 'userId');
  const chatId = toBigIntId(params.chatId, 'chatId');

  const member = await prisma.chatMember.findUnique({ where: { userId_chatId: { userId: mappedUserId, chatId } } });
  if (!member) return fail('Forbidden', 403);

  const url = new URL(req.url);
  const cursor = url.searchParams.get('cursor');
  const mappedCursor = cursor ? toBigIntId(cursor, 'cursor') : undefined;
  const take = Math.min(Number(url.searchParams.get('take') || '30'), 100);

  const messages = await prisma.message.findMany({
    where: { chatId },
    orderBy: { createdAt: 'desc' },
    take,
    ...(mappedCursor ? { skip: 1, cursor: { id: mappedCursor } } : {}),
  });

  return ok({
    messages: messages.map(mapMessage),
    nextCursor: messages.length === take ? messages[messages.length - 1]?.id.toString() : undefined,
  });
}
