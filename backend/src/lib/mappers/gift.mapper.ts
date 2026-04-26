import type { Gift, UserGift } from '@prisma/client';
import type { GiftDTO, UserGiftDTO } from '@/modules/gifts/dto';

import { bigIntToString } from './id';

export function mapGift(gift: Gift): GiftDTO {
  if (!gift?.id) {
    throw new Error('Invalid gift');
  }

  return {
    id: gift.id.toString(),
    title: gift.title,
    icon: gift.icon,
    animation: gift.animation ?? null,
    price: gift.price,
    rarity: gift.rarity,
  };
}

export function mapUserGift(item: UserGift & { gift: Gift }): UserGiftDTO {
  if (!item?.gift) {
    throw new Error('Missing gift relation');
  }

  return {
    id: bigIntToString(item.id, 'userGift.id'),
    gift: mapGift(item.gift),
    senderId: bigIntToString(item.senderId, 'userGift.senderId'),
    receiverId: bigIntToString(item.receiverId, 'userGift.receiverId'),
    date: new Date(item.createdAt).getTime(),
  };
}
