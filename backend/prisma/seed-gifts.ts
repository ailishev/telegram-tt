import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedGifts() {
  const gift = await prisma.gift.upsert({
    where: { id: 1n },
    update: {
      title: 'Telegram Star',
      icon: '⭐',
      animation: null,
      price: 0,
      rarity: 'rare',
    },
    create: {
      title: 'Telegram Star',
      icon: '⭐',
      animation: null,
      price: 0,
      rarity: 'rare',
    },
  });

  const users = await prisma.user.findMany({ select: { id: true } });

  for (const user of users) {
    const exists = await prisma.userGift.findFirst({
      where: {
        senderId: user.id,
        receiverId: user.id,
        giftId: gift.id,
      },
      select: { id: true },
    });

    if (!exists) {
      await prisma.userGift.create({
        data: {
          senderId: user.id,
          receiverId: user.id,
          giftId: gift.id,
        },
      });
    }
  }
}

seedGifts()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (err) => {
    // eslint-disable-next-line no-console
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
