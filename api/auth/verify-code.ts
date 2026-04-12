import { prisma } from '../../server/prisma.js';
import {
  createSessionToken,
  hashSessionToken,
  isValidPhoneNumber,
  normalizePhoneNumber,
  parseBody,
  SESSION_TTL,
  setSessionCookie,
} from '../../server/http.js';

const MAX_ATTEMPTS = 5;

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { phoneNumber, code } = parseBody<{ phoneNumber?: string; code?: string }>(req);
  const normalizedPhone = normalizePhoneNumber(phoneNumber || '');
  const sanitizedCode = (code || '').replace(/[^\d]/g, '').slice(0, 5);

  if (!isValidPhoneNumber(normalizedPhone) || sanitizedCode.length !== 5) {
    res.status(400).json({ error: 'Invalid payload' });
    return;
  }

  const now = new Date();
  const verificationCode = await prisma.verificationCode.findFirst({
    where: {
      phoneNumber: normalizedPhone,
      isUsed: false,
      expiresAt: { gt: now },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  if (!verificationCode) {
    res.status(400).json({ error: 'Code expired or not found' });
    return;
  }

  if (verificationCode.attemptsCount >= MAX_ATTEMPTS) {
    await prisma.verificationCode.update({
      where: { id: verificationCode.id },
      data: { isUsed: true },
    });
    res.status(400).json({ error: 'Too many attempts' });
    return;
  }

  if (verificationCode.code !== sanitizedCode) {
    await prisma.verificationCode.update({
      where: { id: verificationCode.id },
      data: {
        attemptsCount: { increment: 1 },
      },
    });

    res.status(400).json({ error: 'Invalid code' });
    return;
  }

  const profile = await prisma.profile.upsert({
    where: { phoneNumber: normalizedPhone },
    create: {
      phoneNumber: normalizedPhone,
      username: `user_${Date.now()}`,
      firstName: '',
      lastName: '',
      displayName: '',
    },
    update: {},
  });

  await prisma.verificationCode.update({
    where: { id: verificationCode.id },
    data: {
      isUsed: true,
      attemptsCount: { increment: 1 },
    },
  });

  const rawToken = createSessionToken();
  const tokenHash = hashSessionToken(rawToken);
  const expiresAt = new Date(Date.now() + SESSION_TTL);

  await prisma.session.create({
    data: {
      profileId: profile.id,
      tokenHash,
      expiresAt,
    },
  });

  setSessionCookie(res, rawToken);

  const needsOnboarding = !profile.firstName;

  res.status(200).json({
    ok: true,
    profile: {
      id: profile.id,
      phoneNumber: profile.phoneNumber,
      firstName: profile.firstName,
      lastName: profile.lastName,
      username: profile.username,
    },
    needsOnboarding,
  });
}
