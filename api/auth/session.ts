import { prisma } from '../_lib/prisma.js';
import { clearSessionCookie, hashSessionToken, readSessionToken } from '../_lib/http.js';

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const rawToken = readSessionToken(req);
  if (!rawToken) {
    res.status(200).json({ authenticated: false });
    return;
  }

  const tokenHash = hashSessionToken(rawToken);
  const now = new Date();

  const session = await prisma.session.findUnique({
    where: { tokenHash },
    include: { profile: true },
  });

  if (!session || session.expiresAt <= now) {
    if (session) {
      await prisma.session.delete({ where: { id: session.id } });
    }
    clearSessionCookie(res);
    res.status(200).json({ authenticated: false });
    return;
  }

  res.status(200).json({
    authenticated: true,
    profile: {
      id: session.profile.id,
      phoneNumber: session.profile.phoneNumber,
      firstName: session.profile.firstName,
      lastName: session.profile.lastName,
      username: session.profile.username,
    },
    needsOnboarding: !session.profile.firstName,
  });
}
