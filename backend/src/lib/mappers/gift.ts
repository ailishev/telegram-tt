import type { Gift, UserGift } from '@prisma/client';

import { ensureDate, ensureString } from './common';

export type GiftDTO = {
  id: string;
  name: string;
  icon: string;
  animation?: string;
  price: number;
  rarity: Gift['rarity'];
};

export type UserGiftDTO = {
  id: string;
  senderId: string;
  receiverId: string;
  giftId: string;
  messageId: string;
  createdAt: string;
};

export function toGiftDTO(gift: Gift): GiftDTO {
  return {
    id: ensureString(gift.id, 'gift.id'),
    name: ensureString(gift.name, 'gift.name'),
    icon: ensureString(gift.icon, 'gift.icon'),
    animation: gift.animation || undefined,
    price: gift.price,
    rarity: gift.rarity,
  };
}

export function toUserGiftDTO(userGift: UserGift): UserGiftDTO {
  return {
    id: ensureString(userGift.id, 'userGift.id'),
    senderId: ensureString(userGift.senderId, 'userGift.senderId'),
    receiverId: ensureString(userGift.receiverId, 'userGift.receiverId'),
    giftId: ensureString(userGift.giftId, 'userGift.giftId'),
    messageId: ensureString(userGift.messageId, 'userGift.messageId'),
    createdAt: ensureDate(userGift.createdAt, 'userGift.createdAt').toISOString(),
  };
}
