import { prisma } from '../../server/prisma.js';
import { hashSessionToken, parseBody, readSessionToken } from '../../server/http.js';

export default async function handler(req: any, res: any) {
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

  const { firstName, lastName } = parseBody<{ firstName?: string; lastName?: string }>(req);
  const trimmedFirstName = (firstName || '').trim();
  const trimmedLastName = (lastName || '').trim();

  if (!trimmedFirstName) {
    res.status(400).json({ error: 'First name is required' });
    return;
  }

  const usernameBase = `${trimmedFirstName}${trimmedLastName}`.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 24) || `user_${Date.now()}`;

  const profile = await prisma.profile.update({
    where: { id: session.profileId },
    data: {
      firstName: trimmedFirstName,
      lastName: trimmedLastName,
      displayName: [trimmedFirstName, trimmedLastName].filter(Boolean).join(' ').trim(),
      username: usernameBase,
    },
  });

  res.status(200).json({
    ok: true,
    profile: {
      id: profile.id,
      phoneNumber: profile.phoneNumber,
      firstName: profile.firstName,
      lastName: profile.lastName,
      username: profile.username,
    },
  });
}
