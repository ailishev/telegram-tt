import crypto from 'crypto';

const SESSION_COOKIE_NAME = 'telegram_tt_session';
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30;

export function normalizePhoneNumber(phoneNumber: string): string {
  const digits = phoneNumber.replace(/[^\d]/g, '');
  if (!digits) return '';
  return `+${digits}`;
}

export function isValidPhoneNumber(phoneNumber: string): boolean {
  const normalized = normalizePhoneNumber(phoneNumber);
  return normalized.length >= 8 && normalized.length <= 18;
}

export function parseBody<T = Record<string, unknown>>(req: any): T {
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body) as T;
    } catch {
      return {} as T;
    }
  }

  return (req.body || {}) as T;
}

export function parseCookies(req: any): Record<string, string> {
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) {
    return {};
  }

  return cookieHeader.split(';').reduce((acc: Record<string, string>, chunk: string) => {
    const [rawKey, ...rest] = chunk.trim().split('=');
    const key = rawKey?.trim();
    if (!key) return acc;

    acc[key] = decodeURIComponent(rest.join('='));
    return acc;
  }, {} as Record<string, string>);
}

function buildCookie(value: string, expiresAt: Date) {
  const isProduction = process.env.NODE_ENV === 'production';
  const attrs = [
    `${SESSION_COOKIE_NAME}=${encodeURIComponent(value)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Expires=${expiresAt.toUTCString()}`,
  ];

  if (isProduction) {
    attrs.push('Secure');
  }

  return attrs.join('; ');
}

export function clearSessionCookie(res: any) {
  res.setHeader('Set-Cookie', buildCookie('', new Date(0)));
}

export function setSessionCookie(res: any, rawToken: string) {
  res.setHeader('Set-Cookie', buildCookie(rawToken, new Date(Date.now() + SESSION_TTL_MS)));
}

export function readSessionToken(req: any) {
  const cookies = parseCookies(req);
  return cookies[SESSION_COOKIE_NAME];
}

export function createSessionToken() {
  return crypto.randomBytes(32).toString('hex');
}

export function hashSessionToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function generateCode() {
  return `${Math.floor(10000 + Math.random() * 90000)}`;
}

export const SESSION_TTL = SESSION_TTL_MS;
export const CODE_TTL = 1000 * 60 * 10;
