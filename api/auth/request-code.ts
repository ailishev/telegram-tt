import { prisma } from '../_lib/prisma.js';
import { CODE_TTL, generateCode, isValidPhoneNumber, normalizePhoneNumber, parseBody } from '../_lib/http.js';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { phoneNumber } = parseBody<{ phoneNumber?: string }>(req);
  const normalizedPhone = normalizePhoneNumber(phoneNumber || '');

  if (!isValidPhoneNumber(normalizedPhone)) {
    res.status(400).json({ error: 'Invalid phone number' });
    return;
  }

  const now = new Date();

  await prisma.verificationCode.updateMany({
    where: {
      phoneNumber: normalizedPhone,
      isUsed: false,
      expiresAt: { gt: now },
    },
    data: {
      isUsed: true,
    },
  });

  const code = generateCode();
  const expiresAt = new Date(Date.now() + CODE_TTL);

  await prisma.verificationCode.create({
    data: {
      phoneNumber: normalizedPhone,
      code,
      expiresAt,
    },
  });

  console.log(`[auth][request-code] ${normalizedPhone} -> ${code}`);

  res.status(200).json({ ok: true, expiresAt: expiresAt.toISOString() });
}
