import { prisma } from '../../server/prisma.js';
import { clearSessionCookie, hashSessionToken, readSessionToken } from '../../server/http.js';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const rawToken = readSessionToken(req);
  if (rawToken) {
    const tokenHash = hashSessionToken(rawToken);
    await prisma.session.deleteMany({ where: { tokenHash } });
  }

  clearSessionCookie(res);

  res.status(200).json({ ok: true });
}
