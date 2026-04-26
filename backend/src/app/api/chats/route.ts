import { getAuthUserId } from '@/lib/auth';
import { fail, ok, parseError } from '@/lib/http';
import { toChatDTO } from '@/lib/mappers/chat';
import { createChatSchema } from '@/modules/chats/schema';
import { createChat, listChats } from '@/modules/chats/service';

export async function GET() {
  const userId = await getAuthUserId();
  if (!userId) return fail('Unauthorized', 401);
  const rows = await listChats(userId);
  const chats = rows.map((row) => toChatDTO(row.chat));
  return ok({ chats });
}

export async function POST(req: Request) {
  try {
    const userId = await getAuthUserId();
    if (!userId) return fail('Unauthorized', 401);
    const body = createChatSchema.parse(await req.json());
    const chat = await createChat(userId, body);
    return ok({ chat: toChatDTO(chat, chat.members) }, 201);
  } catch (err) {
    return parseError(err);
  }
}
