import { getAuthUserId } from '@/lib/auth';
import { fail, ok } from '@/lib/http';
import { toUserDTO } from '@/lib/mappers/user';
import { toBigIntId } from '@/lib/mappers/id';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const userId = await getAuthUserId();
  if (!userId) return fail('Unauthorized', 401);
  const user = await prisma.user.findUnique({ where: { id: toBigIntId(userId, 'userId') } });
  if (!user) return fail('Not found', 404);
  return ok({ user: toUserDTO(user) });
}
