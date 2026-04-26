import { setAuthCookies } from '@/lib/auth';
import { ok, parseError } from '@/lib/http';
import { registerSchema } from '@/modules/auth/schema';
import { register } from '@/modules/auth/service';

export async function POST(req: Request) {
  try {
    const body = registerSchema.parse(await req.json());
    const result = await register(body);
    setAuthCookies(result.accessToken, result.refreshToken);
    return ok({ user: { id: result.user.id, username: result.user.username, email: result.user.email } }, 201);
  } catch (err) {
    return parseError(err);
  }
}
