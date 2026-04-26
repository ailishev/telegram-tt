import { prisma } from '@/lib/prisma';
import { sendMessage } from '@/modules/messages/service';
import { mapUserGift } from '@/lib/mappers/gift.mapper';
import { toBigIntId } from '@/lib/mappers/id';
import type { GiftDTO, UserGiftDTO } from './dto';
import { mapGift } from '@/lib/mappers/gift.mapper';

export async function getProfileGifts(userId: string): Promise<UserGiftDTO[]> {
  if (!userId) {
    throw new Error('userId required');
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
  if (!input.receiverId || !input.giftId) {
    throw new Error('Invalid gift payload');
  }

  const senderId = toBigIntId(userId, 'senderId');
  const receiverId = toBigIntId(input.receiverId, 'receiverId');
  const giftId = toBigIntId(input.giftId, 'giftId');

  const message = await sendMessage(userId, {
    chatId: input.chatId,
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
