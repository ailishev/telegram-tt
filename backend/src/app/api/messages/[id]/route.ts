import { getAuthUserId } from '@/lib/auth';
import { fail, ok, parseError } from '@/lib/http';
import { prisma } from '@/lib/prisma';
import { editMessageSchema } from '@/modules/messages/schema';
import { toBigIntId } from '@/lib/mappers/id';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const userId = await getAuthUserId();
    if (!userId) return fail('Unauthorized', 401);
    const senderId = toBigIntId(userId, 'senderId');
    const messageId = toBigIntId(params.id, 'messageId');
    const body = editMessageSchema.parse(await req.json());

    const message = await prisma.message.findUnique({ where: { id: messageId } });
    if (!message || message.senderId !== senderId) return fail('Forbidden', 403);

    const updated = await prisma.message.update({
      where: { id: messageId },
      data: { content: body.content, editedAt: new Date() },
    });

    return ok({ message: updated });
  } catch (err) {
    return parseError(err);
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const userId = await getAuthUserId();
  if (!userId) return fail('Unauthorized', 401);
  const senderId = toBigIntId(userId, 'senderId');
  const messageId = toBigIntId(params.id, 'messageId');

  const message = await prisma.message.findUnique({ where: { id: messageId } });
  if (!message || message.senderId !== senderId) return fail('Forbidden', 403);

  await prisma.message.update({ where: { id: messageId }, data: { isDeleted: true } });
  return ok({ ok: true });
}
