import { prisma } from '../server/prisma.js';
import { hashSessionToken, parseBody, readSessionToken } from '../server/http.js';

async function getSessionProfile(req: any) {
  const rawToken = readSessionToken(req);
  if (!rawToken) return undefined;

  const session = await prisma.session.findUnique({
    where: { tokenHash: hashSessionToken(rawToken) },
  });

  if (!session || session.expiresAt <= new Date()) return undefined;
  return session.profileId;
}

export default async function handler(req: any, res: any) {
  const profileId = await getSessionProfile(req);
  if (!profileId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  if (req.method === 'GET') {
    const dialogId = String(req.query?.dialogId || '');
    if (!dialogId) {
      res.status(400).json({ error: 'dialogId is required' });
      return;
    }

    const membership = await prisma.dialogMember.findFirst({
      where: { dialogId, profileId },
    });

    if (!membership) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const messages = await prisma.message.findMany({
      where: { dialogId },
      orderBy: { createdAt: 'asc' },
      take: 200,
    });

    res.status(200).json({ messages });
    return;
  }

  if (req.method === 'POST') {
    const { dialogId, content } = parseBody<{ dialogId?: string; content?: string }>(req);
    const text = (content || '').trim();
    if (!dialogId || !text) {
      res.status(400).json({ error: 'dialogId and content are required' });
      return;
    }

    const membership = await prisma.dialogMember.findFirst({
      where: { dialogId, profileId },
    });

    if (!membership) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const message = await prisma.message.create({
      data: {
        dialogId,
        senderProfileId: profileId,
        content: text,
      },
    });

    await prisma.dialog.update({
      where: { id: dialogId },
      data: {
        lastMessagePreview: text,
        lastMessageAt: message.createdAt,
      },
    });

    res.status(200).json({ message });
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
}
