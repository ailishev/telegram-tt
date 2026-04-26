import { fail, ok } from '@/lib/http';
import { getRefreshToken, setAuthCookies, signAccessToken, signRefreshToken, verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST() {
  const refresh = getRefreshToken();
  if (!refresh) return fail('Unauthorized', 401);

  const session = await prisma.session.findUnique({ where: { token: refresh }, include: { user: true } });
  if (!session || session.expiresAt <= new Date()) return fail('Unauthorized', 401);

  await verifyToken(refresh);
  const payload = { sub: session.userId.toString(), username: session.user.username };
  const accessToken = await signAccessToken(payload);
  const nextRefresh = await signRefreshToken(payload);

  await prisma.session.update({ where: { id: session.id }, data: { token: nextRefresh, expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30) } });
  setAuthCookies(accessToken, nextRefresh);

  return ok({ ok: true });
}
