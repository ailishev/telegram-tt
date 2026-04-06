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

  const linked = await prisma.linkedTelegramAccount.findUnique({
    where: { profileId: session.profileId },
  });

  if (!linked) {
    res.status(400).json({ error: 'Telegram account is not linked' });
    return;
  }

  const body = parseBody<{
    giftId: string;
    starsCost: number;
    telegramPeerId?: string;
    telegramReferenceId?: string;
    metadataJson?: unknown;
  }>(req);

  if (!body.giftId || !Number.isFinite(body.starsCost) || body.starsCost <= 0) {
    res.status(400).json({ error: 'giftId and positive starsCost are required' });
    return;
  }

  const starsCost = Math.floor(body.starsCost);

  const result = await prisma.$transaction(async (tx) => {
    const balance = await tx.localStarsBalance.upsert({
      where: { profileId: session.profileId },
      update: {},
      create: { profileId: session.profileId, balance: 0 },
    });

    if (balance.balance < starsCost) {
      return { ok: false as const, balance: balance.balance };
    }

    const updatedBalance = await tx.localStarsBalance.update({
      where: { profileId: session.profileId },
      data: { balance: { decrement: starsCost } },
    });

    await tx.localStarsTransaction.create({
      data: {
        profileId: session.profileId,
        amount: -starsCost,
        type: 'gift_purchase',
        referenceType: 'telegram_gift',
        referenceId: body.giftId,
        metadataJson: {
          linkedTelegramUserId: linked.telegramUserId,
          telegramPeerId: body.telegramPeerId,
          telegramReferenceId: body.telegramReferenceId,
          ...((body.metadataJson && typeof body.metadataJson === 'object') ? body.metadataJson : {}),
        },
      },
    });

    return { ok: true as const, balance: updatedBalance.balance };
  });

  if (!result.ok) {
    console.info('[gifts][api] local stars balance checked: insufficient', {
      profileId: session.profileId,
      balance: result.balance,
      starsCost,
    });
    res.status(400).json({ error: 'Insufficient local stars balance', balance: result.balance });
    return;
  }

  // Telegram-side purchase must be executed by Telegram client session layer.
  console.info('[gifts][api] local stars deducted, trigger Telegram-side purchase on client', {
    profileId: session.profileId,
    linkedTelegramUserId: linked.telegramUserId,
    giftId: body.giftId,
    starsCost,
    balanceAfter: result.balance,
  });

  res.status(200).json({
    success: true,
    balance: result.balance,
    linkedTelegramUserId: linked.telegramUserId,
  });
}
