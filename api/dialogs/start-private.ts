import { prisma } from '../../server/prisma.js';
import { hashSessionToken, parseBody, readSessionToken } from '../../server/http.js';

export default async function handler(req: any, res: any) {
  console.info('[search][api] start-private request', { method: req.method });
  if (req.method !== 'POST') {
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

  const { targetProfileId, username } = parseBody<{ targetProfileId?: string; username?: string }>(req);

  const target = targetProfileId
    ? await prisma.profile.findUnique({ where: { id: targetProfileId } })
    : username
      ? await prisma.profile.findFirst({ where: { username } })
      : undefined;

  if (!target) {
    res.status(404).json({ error: 'Target user not found' });
    return;
  }

  const existingMemberships = await prisma.dialogMember.findMany({
    where: { profileId: { in: [session.profileId, target.id] } },
    include: { dialog: true },
  });

  const groupedByDialog = existingMemberships.reduce((acc, membership) => {
    acc[membership.dialogId] = acc[membership.dialogId] || [];
    acc[membership.dialogId].push(membership.profileId);
    return acc;
  }, {} as Record<string, string[]>);

  const existingDialogId = Object.entries(groupedByDialog)
    .find(([, profileIds]) => profileIds.includes(session.profileId) && profileIds.includes(target.id))?.[0];

  if (existingDialogId) {
    console.info('[search][api] start-private existing dialog', { dialogId: existingDialogId });
    res.status(200).json({ dialogId: existingDialogId, created: false });
    return;
  }

  const dialog = await prisma.dialog.create({
    data: {
      type: 'private',
      title: [target.firstName, target.lastName].filter(Boolean).join(' ').trim() || target.username || 'Chat',
      createdByProfileId: session.profileId,
      members: {
        create: [
          { profileId: session.profileId },
          { profileId: target.id },
        ],
      },
    },
  });

  console.info('[search][api] start-private created dialog', { dialogId: dialog.id });
  res.status(200).json({ dialogId: dialog.id, created: true });
}
