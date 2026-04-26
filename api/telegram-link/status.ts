import { prisma } from '../_lib/prisma.js';
import { hashSessionToken, readSessionToken } from '../_lib/http.js';

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const rawToken = readSessionToken(req);
  if (!rawToken) {
    res.status(200).json({ linked: false });
    return;
  }

  const session = await prisma.session.findUnique({
    where: { tokenHash: hashSessionToken(rawToken) },
  });

  if (!session || session.expiresAt <= new Date()) {
    res.status(200).json({ linked: false });
    return;
  }

  const linked = await prisma.linkedTelegramAccount.findUnique({
    where: { profileId: session.profileId },
  });

  console.info('[telegram-link][api] status', {
    profileId: session.profileId,
    linked: Boolean(linked),
  });

  res.status(200).json({
    linked: Boolean(linked),
    telegram: linked ? {
      telegramUserId: linked.telegramUserId,
      telegramPhone: linked.telegramPhone,
      telegramUsername: linked.telegramUsername,
      linkedAt: linked.linkedAt,
    } : undefined,
  });
}
