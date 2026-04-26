import { ok } from '@/lib/http';
import { toGiftDTO } from '@/lib/mappers/gift';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const gifts = await prisma.gift.findMany({ orderBy: [{ price: 'asc' }, { createdAt: 'desc' }] });
  return ok({ gifts: gifts.map(toGiftDTO) });
}
