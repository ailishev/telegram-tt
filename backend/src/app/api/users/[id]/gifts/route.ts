import { fail, ok } from '@/lib/http';
import { getProfileGifts } from '@/modules/gifts/service';

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const result = await getProfileGifts(params.id);
    return ok({ result });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Invalid request';
    return fail(message, 400);
  }
}
