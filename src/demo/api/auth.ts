type ProfilePayload = {
  id: string;
  phoneNumber?: string;
  firstName?: string;
  lastName?: string;
  username?: string;
};

type SessionPayload = {
  authenticated: boolean;
  needsOnboarding?: boolean;
  profile?: ProfilePayload;
};

async function callBackend<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
    ...init,
  });

  const text = await response.text();
  const payload = text ? JSON.parse(text) : {};

  if (!response.ok) {
    throw new Error(payload?.error || 'Request failed');
  }

  return payload as T;
}

export function normalizePhoneNumber(phoneNumber: string): string {
  return `+${phoneNumber.replace(/[^\d]/g, '')}`;
}

export function isAllowedDemoPhone(phoneNumber: string): boolean {
  const normalized = normalizePhoneNumber(phoneNumber);
  return normalized.length >= 8;
}

export async function requestDemoLoginCode(phoneNumber: string) {
  const normalizedPhone = normalizePhoneNumber(phoneNumber);
  return callBackend<{ ok: boolean; expiresAt: string }>('/api/auth/request-code', {
    method: 'POST',
    body: JSON.stringify({ phoneNumber: normalizedPhone }),
  });
}

export async function verifyDemoLoginCode(phoneNumber: string, code: string) {
  const normalizedPhone = normalizePhoneNumber(phoneNumber);
  return callBackend<{ ok: boolean; needsOnboarding: boolean; profile: ProfilePayload }>('/api/auth/verify-code', {
    method: 'POST',
    body: JSON.stringify({ phoneNumber: normalizedPhone, code }),
  });
}

export async function getBackendSession() {
  return callBackend<SessionPayload>('/api/auth/session', { method: 'GET' });
}

export async function completeProfileOnboarding(firstName: string, lastName: string) {
  return callBackend<{ ok: boolean; profile: ProfilePayload }>('/api/profile/create', {
    method: 'POST',
    body: JSON.stringify({ firstName, lastName }),
  });
}

export async function getCurrentProfile() {
  return callBackend<{ profile: ProfilePayload }>('/api/profile/get-current', { method: 'GET' });
}

export async function logoutBackendSession() {
  return callBackend<{ ok: boolean }>('/api/auth/logout', { method: 'POST' });
}
