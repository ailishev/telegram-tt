import { fail, ok } from '@/lib/http';
import { toBigIntId } from '@/lib/mappers/id';
import { toUserDTO } from '@/lib/mappers/user';
import { prisma } from '@/lib/prisma';

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const user = await prisma.user.findUnique({ where: { id: toBigIntId(params.id, 'userId') } });
  if (!user) return fail('Not found', 404);
  return ok({ user: toUserDTO(user) });
}
