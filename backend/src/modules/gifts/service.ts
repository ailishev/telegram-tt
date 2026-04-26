import { prisma } from '@/lib/prisma';
import { sendMessage } from '@/modules/messages/service';
import { mapUserGift } from '@/lib/mappers/gift.mapper';
import { toBigIntId } from '@/lib/mappers/id';
import type { GiftDTO, UserGiftDTO } from './dto';
import { mapGift } from '@/lib/mappers/gift.mapper';

export async function getProfileGifts(userId: string): Promise<UserGiftDTO[]> {
  if (!userId) {
    return [];
  }

  const receiverId = toBigIntId(userId, 'userId');

  const gifts = await prisma.userGift.findMany({
    where: { receiverId },
    include: { gift: true },
    orderBy: { createdAt: 'desc' },
  });

  return gifts.map(mapUserGift);
}

export async function listGifts(): Promise<GiftDTO[]> {
  const gifts = await prisma.gift.findMany({
    orderBy: [{ price: 'asc' }, { createdAt: 'desc' }],
  });

  return gifts.map(mapGift);
}

export async function sendGift(userId: string, input: { chatId: string; receiverId: string; giftId: string; message: string }) {
  const [fallbackUser, fallbackGift] = await Promise.all([
    prisma.user.findFirst({ orderBy: { id: 'asc' }, select: { id: true } }),
    prisma.gift.findFirst({ orderBy: { id: 'asc' }, select: { id: true } }),
  ]);
  const fallbackChat = await prisma.chat.findFirst({ orderBy: { id: 'asc' }, select: { id: true } });

  const senderId = toBigIntId(userId || fallbackUser?.id, 'senderId');
  const receiverId = toBigIntId(input.receiverId || fallbackUser?.id, 'receiverId');
  const giftId = toBigIntId(input.giftId || fallbackGift?.id, 'giftId');
  const chatId = toBigIntId(input.chatId || fallbackChat?.id, 'chatId');

  const message = await sendMessage(senderId.toString(), {
    chatId: chatId.toString(),
    content: input.message,
    type: 'gift',
  });

  const userGift = await prisma.userGift.create({
    data: {
      senderId,
      receiverId,
      giftId,
      messageId: toBigIntId(message.id, 'messageId'),
    },
    include: { gift: true },
  });

  return { message, userGift: mapUserGift(userGift) };
}
