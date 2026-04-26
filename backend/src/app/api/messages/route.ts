import { getAuthUserId } from '@/lib/auth';
import { fail, ok, parseError } from '@/lib/http';
import { sendMessageSchema } from '@/modules/messages/schema';
import { sendMessage } from '@/modules/messages/service';

export async function POST(req: Request) {
  try {
    const userId = await getAuthUserId();
    if (!userId) return fail('Unauthorized', 401);

    const body = sendMessageSchema.parse(await req.json());
    const message = await sendMessage(userId, body);
    return ok({ message }, 201);
  } catch (err) {
    return parseError(err);
  }
}
