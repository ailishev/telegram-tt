import {
  completeProfileOnboarding,
  getBackendSession,
  isAllowedDemoPhone,
  logoutBackendSession,
  normalizePhoneNumber,
  verifyDemoLoginCode,
} from './api/auth';

export type DemoSession = {
  userId: string;
  phoneNumber: string;
  needsOnboarding?: boolean;
};

const SESSION_STORAGE_KEY = 'demo.local.session';
const TEMP_PHONE_STORAGE_KEY = 'demo.local.pending_phone';

function toDemoSession(payload: { profile?: { id: string; phoneNumber?: string }; needsOnboarding?: boolean }): DemoSession | undefined {
  if (!payload.profile?.id || !payload.profile.phoneNumber) {
    return undefined;
  }

  return {
    userId: payload.profile.id,
    phoneNumber: payload.profile.phoneNumber,
    needsOnboarding: payload.needsOnboarding,
  };
}

export function getStoredSession(): DemoSession | undefined {
  const rawSession = localStorage.getItem(SESSION_STORAGE_KEY);
  if (!rawSession) return undefined;

  try {
    const parsedSession = JSON.parse(rawSession) as Partial<DemoSession>;

    if (
      typeof parsedSession.userId === 'string'
      && typeof parsedSession.phoneNumber === 'string'
    ) {
      return parsedSession as DemoSession;
    }
  } catch {
    localStorage.removeItem(SESSION_STORAGE_KEY);
  }

  return undefined;
}

export async function restoreSession(): Promise<DemoSession | undefined> {
  try {
    const payload = await getBackendSession();
    if (!payload.authenticated) {
      localStorage.removeItem(SESSION_STORAGE_KEY);
      return undefined;
    }

    const restored = toDemoSession(payload);
    if (!restored) {
      localStorage.removeItem(SESSION_STORAGE_KEY);
      return undefined;
    }

    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(restored));
    return restored;
  } catch {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    return undefined;
  }
}

export function setPendingPhone(phoneNumber: string): void {
  localStorage.setItem(TEMP_PHONE_STORAGE_KEY, normalizePhoneNumber(phoneNumber));
}

export function getPendingPhone(): string | undefined {
  return localStorage.getItem(TEMP_PHONE_STORAGE_KEY) || undefined;
}

export function clearPendingPhone(): void {
  localStorage.removeItem(TEMP_PHONE_STORAGE_KEY);
}

export { isAllowedDemoPhone };

export const signInWithPhone = async (phoneNumber: string, code: string): Promise<DemoSession> => {
  const normalizedPhone = normalizePhoneNumber(phoneNumber);
  const verified = await verifyDemoLoginCode(normalizedPhone, code);
  const session = toDemoSession(verified);

  if (!session) {
    throw new Error('Unable to create session');
  }

  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  clearPendingPhone();

  return session;
};

const completeOnboardingImpl = async (firstName: string, lastName: string): Promise<void> => {
  const session = getStoredSession();
  if (!session) return;

  const updated = await completeProfileOnboarding(firstName, lastName);

  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({
    ...session,
    userId: updated.profile.id,
    phoneNumber: updated.profile.phoneNumber || session.phoneNumber,
    needsOnboarding: false,
  }));
};

export { completeOnboardingImpl as completeOnboarding };

export function signOut(): void {
  void logoutBackendSession();
  localStorage.removeItem(SESSION_STORAGE_KEY);
  clearPendingPhone();
}
