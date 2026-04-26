export type GiftDTO = {
  id: string;
  title: string;
  icon: string;
  animation: string | null;
  price: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
};

export type UserGiftDTO = {
  id: string;
  gift: GiftDTO;
  senderId: string;
  receiverId: string;
  date: number;
};
