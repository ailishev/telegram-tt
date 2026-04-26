import { getAuthUserId } from '@/lib/auth';
import { fail, ok, parseError } from '@/lib/http';
import { prisma } from '@/lib/prisma';
import { updateMembersSchema } from '@/modules/chats/schema';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const actorId = await getAuthUserId();
    if (!actorId) return fail('Unauthorized', 401);

    const owner = await prisma.chat.findUnique({ where: { id: params.id }, select: { ownerId: true } });
    if (!owner || owner.ownerId !== actorId) return fail('Forbidden', 403);

    const body = updateMembersSchema.parse(await req.json());
    const member = await prisma.chatMember.upsert({
      where: { userId_chatId: { userId: body.userId, chatId: params.id } },
      create: { userId: body.userId, chatId: params.id, role: body.role || 'member' },
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

  const owner = await prisma.chat.findUnique({ where: { id: params.id }, select: { ownerId: true } });
  if (!owner || owner.ownerId !== actorId) return fail('Forbidden', 403);

  const url = new URL(req.url);
  const userId = url.searchParams.get('userId');
  if (!userId) return fail('userId required');

  await prisma.chatMember.deleteMany({ where: { chatId: params.id, userId } });
  return ok({ ok: true });
}
