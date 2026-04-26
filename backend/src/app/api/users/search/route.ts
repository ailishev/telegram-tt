import { ok } from '@/lib/http';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = (url.searchParams.get('q') || '').trim();
  const users = await prisma.user.findMany({
    where: q ? {
      OR: [
        { username: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
      ],
    } : undefined,
    take: 30,
    orderBy: { createdAt: 'desc' },
  });

  return ok({ users });
}
