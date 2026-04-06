import { prisma } from '../_lib/prisma.js';
import { hashSessionToken, parseBody, readSessionToken } from '../_lib/http.js';

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

  const body = parseBody<{
    telegramUserId: string;
    telegramPhone?: string;
    telegramUsername?: string;
    telegramSessionCipher?: string;
  }>(req);

  if (!body.telegramUserId) {
    res.status(400).json({ error: 'telegramUserId is required' });
    return;
  }

  const linked = await prisma.linkedTelegramAccount.upsert({
    where: { profileId: session.profileId },
    update: {
      telegramUserId: body.telegramUserId,
      telegramPhone: body.telegramPhone,
      telegramUsername: body.telegramUsername,
      telegramSessionCipher: body.telegramSessionCipher,
    },
    create: {
      profileId: session.profileId,
      telegramUserId: body.telegramUserId,
      telegramPhone: body.telegramPhone,
      telegramUsername: body.telegramUsername,
      telegramSessionCipher: body.telegramSessionCipher,
    },
  });

  console.info('[telegram-link][api] linked', {
    profileId: session.profileId,
    telegramUserId: linked.telegramUserId,
  });

  res.status(200).json({
    linked: true,
    telegram: {
      telegramUserId: linked.telegramUserId,
      telegramPhone: linked.telegramPhone,
      telegramUsername: linked.telegramUsername,
      linkedAt: linked.linkedAt,
    },
  });
}
