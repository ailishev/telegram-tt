import { prisma } from '../server/prisma.js';
import { hashSessionToken, readSessionToken } from '../server/http.js';

export default async function handler(req: any, res: any) {
  console.info('[search][api] request', { method: req.method, q: req.query?.q });
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

  const qRaw = String(req.query?.q || '').trim();
  const q = qRaw.startsWith('@') ? qRaw.slice(1) : qRaw;
  const users = await prisma.profile.findMany({
    where: q ? {
      OR: [
        { username: { contains: q, mode: 'insensitive' } },
        { firstName: { contains: q, mode: 'insensitive' } },
        { lastName: { contains: q, mode: 'insensitive' } },
        { displayName: { contains: q, mode: 'insensitive' } },
      ],
    } : {
      id: session.profileId,
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
    .filter((dialog) => !q || dialog.title?.toLowerCase().includes(q.toLowerCase()));

  const selfProfile = users.find((user) => user.id === session.profileId)
    || await prisma.profile.findUnique({ where: { id: session.profileId } });

  const resultUsers = selfProfile
    ? [selfProfile, ...users.filter((user) => user.id !== selfProfile.id)]
    : users;

  console.info('[search][api] response', { usersCount: resultUsers.length, dialogsCount: dialogs.length });
  res.status(200).json({ users: resultUsers, dialogs });
}
