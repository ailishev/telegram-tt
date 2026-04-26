import { clearAuthCookies, getRefreshToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ok } from '@/lib/http';

export async function POST() {
  const refresh = getRefreshToken();
  if (refresh) {
    await prisma.session.deleteMany({ where: { token: refresh } });
  }
  clearAuthCookies();
  return ok({ ok: true });
}
