import { prisma } from '@/lib/prisma';
import { hashPassword, verifyPassword, signAccessToken, signRefreshToken } from '@/lib/auth';

export async function register(input: { username: string; email: string; password: string }) {
  const passwordHash = await hashPassword(input.password);
  const user = await prisma.user.create({
    data: {
      username: input.username,
      email: input.email,
      passwordHash,
    },
  });

  const payload = { sub: user.id.toString(), username: user.username };
  const accessToken = await signAccessToken(payload);
  const refreshToken = await signRefreshToken(payload);

  await prisma.session.create({
    data: {
      userId: user.id,
      token: refreshToken,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
    },
  });

  return { user, accessToken, refreshToken };
}

export async function login(input: { email: string; password: string }) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user) return undefined;
  const valid = await verifyPassword(input.password, user.passwordHash);
  if (!valid) return undefined;

  const payload = { sub: user.id.toString(), username: user.username };
  const accessToken = await signAccessToken(payload);
  const refreshToken = await signRefreshToken(payload);

  await prisma.session.create({
    data: {
      userId: user.id,
      token: refreshToken,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
    },
  });

  return { user, accessToken, refreshToken };
}
