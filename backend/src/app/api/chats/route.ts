import { getAuthUserId } from '@/lib/auth';
import { fail, ok, parseError } from '@/lib/http';
import { createChatSchema } from '@/modules/chats/schema';
import { createChat, listChats } from '@/modules/chats/service';

export async function GET() {
  const userId = await getAuthUserId();
  if (!userId) return fail('Unauthorized', 401);
  const chats = await listChats(userId);
  return ok({ chats });
}

export async function POST(req: Request) {
  try {
    const userId = await getAuthUserId();
    if (!userId) return fail('Unauthorized', 401);
    const body = createChatSchema.parse(await req.json());
    const chat = await createChat(userId, body);
    return ok({ chat }, 201);
  } catch (err) {
    return parseError(err);
  }
}
