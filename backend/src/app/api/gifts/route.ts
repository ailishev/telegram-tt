import { ok } from '@/lib/http';
import { listGifts } from '@/modules/gifts/service';

export async function GET() {
  const gifts = await listGifts();
  return ok({ gifts });
}
