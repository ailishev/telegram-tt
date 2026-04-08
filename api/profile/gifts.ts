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

  const { title, iconUrl, rarity } = parseBody<{
    title?: string;
    iconUrl?: string;
    rarity?: string;
  }>(req);

  const gift = await prisma.profileGift.create({
    data: {
      profileId: session.profileId,
      title: title || 'Подарок',
      iconUrl,
      rarity,
      isDisplayed: true,
      metadataJson: {
        source: 'api.profile.gifts',
      },
    },
  });

  res.status(200).json({ ok: true, giftId: gift.id });
}
