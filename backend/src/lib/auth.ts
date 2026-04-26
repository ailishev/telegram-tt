import { cookies } from 'next/headers';
import { jwtVerify, SignJWT } from 'jose';
import bcrypt from 'bcryptjs';

const ACCESS_COOKIE = 'access_token';
const REFRESH_COOKIE = 'refresh_token';
const ACCESS_TTL_SEC = 60 * 15;
const REFRESH_TTL_SEC = 60 * 60 * 24 * 30;

const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'change-me');

export type AuthPayload = {
  sub: string;
  username: string;
};

export async function hashPassword(raw: string) {
  return bcrypt.hash(raw, 12);
}

export async function verifyPassword(raw: string, hash: string) {
  return bcrypt.compare(raw, hash);
}

export async function signAccessToken(payload: AuthPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${ACCESS_TTL_SEC}s`)
    .sign(secret);
}

export async function signRefreshToken(payload: AuthPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${REFRESH_TTL_SEC}s`)
    .sign(secret);
}

export async function verifyToken(token: string) {
  const verified = await jwtVerify(token, secret);
  return verified.payload as unknown as AuthPayload;
}

export async function getAuthUserId() {
  const token = cookies().get(ACCESS_COOKIE)?.value;
  if (!token) return undefined;
  try {
    const payload = await verifyToken(token);
    return payload.sub;
  } catch {
    return undefined;
  }
}

export function setAuthCookies(accessToken: string, refreshToken: string) {
  const jar = cookies();
  jar.set(ACCESS_COOKIE, accessToken, { httpOnly: true, sameSite: 'lax', secure: true, path: '/', maxAge: ACCESS_TTL_SEC });
  jar.set(REFRESH_COOKIE, refreshToken, { httpOnly: true, sameSite: 'lax', secure: true, path: '/', maxAge: REFRESH_TTL_SEC });
}

export function clearAuthCookies() {
  const jar = cookies();
  jar.delete(ACCESS_COOKIE);
  jar.delete(REFRESH_COOKIE);
}

export function getRefreshToken() {
  return cookies().get(REFRESH_COOKIE)?.value;
}
