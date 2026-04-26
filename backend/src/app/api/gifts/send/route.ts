import { getAuthUserId } from '@/lib/auth';
import { fail, ok, parseError } from '@/lib/http';
import { sendGiftSchema } from '@/modules/gifts/schema';
import { sendGift } from '@/modules/gifts/service';

export async function POST(req: Request) {
  try {
    const userId = await getAuthUserId();
    if (!userId) return fail('Unauthorized', 401);

    const body = sendGiftSchema.parse(await req.json());
    const result = await sendGift(userId, body);
    return ok(result, 201);
  } catch (err) {
    return parseError(err);
  }
}
