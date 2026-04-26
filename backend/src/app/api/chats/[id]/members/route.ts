import { getAuthUserId } from '@/lib/auth';
import { fail, ok, parseError } from '@/lib/http';
import { prisma } from '@/lib/prisma';
import { updateMembersSchema } from '@/modules/chats/schema';
import { toBigIntId } from '@/lib/mappers/id';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const actorId = await getAuthUserId();
    if (!actorId) return fail('Unauthorized', 401);
    const mappedActorId = toBigIntId(actorId, 'actorId');
    const chatId = toBigIntId(params.id, 'chatId');

    const owner = await prisma.chat.findUnique({ where: { id: chatId }, select: { ownerId: true } });
    if (!owner || owner.ownerId !== mappedActorId) return fail('Forbidden', 403);

    const body = updateMembersSchema.parse(await req.json());
    const targetUserId = toBigIntId(body.userId, 'userId');
    const member = await prisma.chatMember.upsert({
      where: { userId_chatId: { userId: targetUserId, chatId } },
      create: { userId: targetUserId, chatId, role: body.role || 'member' },
      update: { role: body.role || 'member' },
    });

    return ok({ member });
  } catch (err) {
    return parseError(err);
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const actorId = await getAuthUserId();
  if (!actorId) return fail('Unauthorized', 401);
  const mappedActorId = toBigIntId(actorId, 'actorId');
  const chatId = toBigIntId(params.id, 'chatId');

  const owner = await prisma.chat.findUnique({ where: { id: chatId }, select: { ownerId: true } });
  if (!owner || owner.ownerId !== mappedActorId) return fail('Forbidden', 403);

  const url = new URL(req.url);
  const userId = url.searchParams.get('userId');
  if (!userId) return fail('userId required');
  const targetUserId = toBigIntId(userId, 'userId');

  await prisma.chatMember.deleteMany({ where: { chatId, userId: targetUserId } });
  return ok({ ok: true });
}
