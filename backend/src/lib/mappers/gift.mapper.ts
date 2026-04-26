import type { Gift, UserGift } from '@prisma/client';

import { bigIntToString } from './id';

export function mapGift(db: Gift) {
  return {
    id: bigIntToString(db.id, 'gift.id'),
    name: db.name,
    icon: db.icon,
    animation: db.animation || undefined,
    price: db.price,
    rarity: db.rarity,
  };
}

export function mapUserGift(db: UserGift) {
  return {
    id: bigIntToString(db.id, 'userGift.id'),
    senderId: bigIntToString(db.senderId, 'userGift.senderId'),
    receiverId: bigIntToString(db.receiverId, 'userGift.receiverId'),
    giftId: bigIntToString(db.giftId, 'userGift.giftId'),
    messageId: db.messageId ? db.messageId.toString() : undefined,
    createdAt: db.createdAt.toISOString(),
  };
}
