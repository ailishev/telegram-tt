import { getAuthUserId } from '@/lib/auth';
import { fail, ok, parseError } from '@/lib/http';
import { prisma } from '@/lib/prisma';
import { editMessageSchema } from '@/modules/messages/schema';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const userId = await getAuthUserId();
    if (!userId) return fail('Unauthorized', 401);
    const body = editMessageSchema.parse(await req.json());

    const message = await prisma.message.findUnique({ where: { id: params.id } });
    if (!message || message.senderId !== userId) return fail('Forbidden', 403);

    const updated = await prisma.message.update({
      where: { id: params.id },
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

  const message = await prisma.message.findUnique({ where: { id: params.id } });
  if (!message || message.senderId !== userId) return fail('Forbidden', 403);

  await prisma.message.update({ where: { id: params.id }, data: { isDeleted: true } });
  return ok({ ok: true });
}
