import { prisma } from './_lib/prisma.js';
import { hashSessionToken, readSessionToken } from './_lib/http.js';

export default async function handler(req: any, res: any) {
  console.info('[dialogs][api] request', { method: req.method });
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
    include: { profile: true },
  });

  if (!session || session.expiresAt <= new Date()) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const memberships = await prisma.dialogMember.findMany({
    where: { profileId: session.profileId },
    include: {
      dialog: {
        include: {
          members: {
            include: {
              profile: true,
            },
          },
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      },
    },
    orderBy: {
      joinedAt: 'desc',
    },
  });

  const dialogs = memberships.map(({ dialog }) => {
    const lastMessage = dialog.messages[0];
    const peerProfile = dialog.type === 'private'
      ? dialog.members.find((member) => member.profileId !== session.profileId)?.profile || session.profile
      : undefined;

    return {
      id: dialog.id,
      type: dialog.type,
      title: dialog.title || peerProfile?.displayName || [peerProfile?.firstName, peerProfile?.lastName].filter(Boolean).join(' ').trim() || 'Dialog',
      unreadCount: dialog.unreadCount,
      lastMessagePreview: dialog.lastMessagePreview || lastMessage?.content || '',
      lastMessageAt: (dialog.lastMessageAt || lastMessage?.createdAt || dialog.updatedAt).toISOString(),
      archived: dialog.archived,
      pinned: dialog.pinned,
      peer: peerProfile ? {
        id: peerProfile.id,
        firstName: peerProfile.firstName,
        lastName: peerProfile.lastName,
        username: peerProfile.username,
        avatarUrl: peerProfile.avatarUrl,
      } : undefined,
    };
  });

  dialogs.sort((left, right) => {
    return new Date(right.lastMessageAt).getTime() - new Date(left.lastMessageAt).getTime();
  });

  console.info('[dialogs][api] response', { dialogsCount: dialogs.length, profileId: session.profileId });

  res.status(200).json({ dialogs });
}
