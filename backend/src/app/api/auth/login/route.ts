import { setAuthCookies } from '@/lib/auth';
import { fail, ok, parseError } from '@/lib/http';
import { loginSchema } from '@/modules/auth/schema';
import { login } from '@/modules/auth/service';

export async function POST(req: Request) {
  try {
    const body = loginSchema.parse(await req.json());
    const result = await login(body);
    if (!result) return fail('Invalid credentials', 401);
    setAuthCookies(result.accessToken, result.refreshToken);
    return ok({ user: { id: result.user.id, username: result.user.username, email: result.user.email } });
  } catch (err) {
    return parseError(err);
  }
}
