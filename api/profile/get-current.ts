import { prisma } from '../_lib/prisma.js';
import { hashSessionToken, readSessionToken } from '../_lib/http.js';

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
    include: { profile: true },
  });

  if (!session || session.expiresAt <= new Date()) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  res.status(200).json({
    profile: {
      id: session.profile.id,
      phoneNumber: session.profile.phoneNumber,
      firstName: session.profile.firstName,
      lastName: session.profile.lastName,
      username: session.profile.username,
      bio: session.profile.bio,
      avatarUrl: session.profile.avatarUrl,
    },
  });
}
