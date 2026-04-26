import { ok } from '@/lib/http';
import { getProfileGifts } from '@/modules/gifts/service';

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const result = await getProfileGifts(params.id);
    return ok({ result });
  } catch (err) {
    return ok({ result: [] });
  }
}
