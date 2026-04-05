import { prisma } from './_lib/prisma.js';
import { hashSessionToken, readSessionToken } from './_lib/http.js';

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const rawToken = readSessionToken(req);
  if (!rawToken) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const session = await prisma.session.findUnique({
    where: { tokenHash: hashSessionToken(rawToken) },
  });

  if (!session || session.expiresAt <= new Date()) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const q = String(req.query?.q || '').trim();
  if (!q) {
    res.status(200).json({ users: [], dialogs: [] });
    return;
  }

  const users = await prisma.profile.findMany({
    where: {
      OR: [
        { username: { contains: q, mode: 'insensitive' } },
        { firstName: { contains: q, mode: 'insensitive' } },
        { lastName: { contains: q, mode: 'insensitive' } },
      ],
    },
    take: 20,
  });

  const memberships = await prisma.dialogMember.findMany({
    where: { profileId: session.profileId },
    include: { dialog: true },
    take: 50,
  });

  const dialogs = memberships
    .map((membership) => membership.dialog)
    .filter((dialog) => dialog.title?.toLowerCase().includes(q.toLowerCase()));

  res.status(200).json({ users, dialogs });
}
