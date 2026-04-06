import { prisma } from '../../server/prisma.js';
import { hashSessionToken, parseBody, readSessionToken } from '../../server/http.js';

export default async function handler(req: any, res: any) {
  console.info('[profile][api] update request', { method: req.method });
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

  const body = parseBody<{
    firstName?: string;
    lastName?: string;
    username?: string;
    bio?: string;
    avatarUrl?: string;
    isVerified?: boolean;
  }>(req);

  const profile = await prisma.profile.update({
    where: { id: session.profileId },
    data: {
      firstName: body.firstName?.trim(),
      lastName: body.lastName?.trim(),
      username: body.username?.trim() || undefined,
      bio: body.bio,
      avatarUrl: body.avatarUrl,
      isVerified: body.isVerified,
      displayName: [body.firstName?.trim(), body.lastName?.trim()].filter(Boolean).join(' ').trim() || undefined,
    },
  });

  res.status(200).json({
    profile: {
      id: profile.id,
      firstName: profile.firstName,
      lastName: profile.lastName,
      username: profile.username,
      bio: profile.bio,
      avatarUrl: profile.avatarUrl,
      isVerified: profile.isVerified,
    },
  });
  console.info('[profile][api] profile update saved', { profileId: profile.id });
}
