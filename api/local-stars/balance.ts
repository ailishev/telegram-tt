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
  });

  if (!session || session.expiresAt <= new Date()) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const balance = await prisma.localStarsBalance.upsert({
    where: { profileId: session.profileId },
    update: {},
    create: {
      profileId: session.profileId,
      balance: 0,
    },
  });

  console.info('[local-auth][api] stars balance', {
    profileId: session.profileId,
    balance: balance.balance,
  });

  res.status(200).json({ balance: balance.balance, updatedAt: balance.updatedAt });
}
