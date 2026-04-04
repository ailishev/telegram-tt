import { ensureDemoProfile, getProfileByPhone, upsertProfileOnboarding } from './api/auth';
import { signInOrSignUpByPhone, signOutSupabase, type SupabaseSession } from './api/supabaseAuth';

export type DemoSession = {
  userId: string;
  phoneNumber: string;
  accessToken: string;
  refreshToken: string;
  expiresAt?: number;
  needsOnboarding?: boolean;
};

const SESSION_STORAGE_KEY = 'demo.local.session';
const TEMP_PHONE_STORAGE_KEY = 'demo.local.pending_phone';

function normalizePhoneNumber(phoneNumber: string): string {
  return `+${phoneNumber.replace(/[^\d]/g, '')}`;
}

function fromSupabaseSession(
  session: SupabaseSession,
  phoneNumber: string,
  needsOnboarding: boolean,
): DemoSession {
  return {
    userId: session.user.id,
    phoneNumber,
    accessToken: session.access_token,
    refreshToken: session.refresh_token,
    expiresAt: session.expires_at,
    needsOnboarding,
  };
}

export function getStoredSession(): DemoSession | undefined {
  const rawSession = localStorage.getItem(SESSION_STORAGE_KEY);
  if (!rawSession) return undefined;

  try {
    const parsedSession = JSON.parse(rawSession) as Partial<DemoSession>;
    const hasAccessToken = typeof parsedSession.accessToken === 'string' && parsedSession.accessToken.length > 0;

    if (
      typeof parsedSession.userId === 'string'
      && typeof parsedSession.phoneNumber === 'string'
      && hasAccessToken
    ) {
      return parsedSession as DemoSession;
    }
  } catch {
    localStorage.removeItem(SESSION_STORAGE_KEY);
  }

  return undefined;
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

export function isAllowedDemoPhone(phoneNumber: string): boolean {
  return normalizePhoneNumber(phoneNumber).length >= 8;
}

export function verifyDemoCode(code: string): boolean {
  return code.trim() === '11111';
}

export async function signInWithPhone(phoneNumber: string): Promise<DemoSession> {
  const normalizedPhone = normalizePhoneNumber(phoneNumber);
  const supabaseSession = await signInOrSignUpByPhone(normalizedPhone);

  await ensureDemoProfile(normalizedPhone, supabaseSession.user.id, supabaseSession.access_token);
  const profile = await getProfileByPhone(normalizedPhone, supabaseSession.access_token);

  const session = fromSupabaseSession(supabaseSession, normalizedPhone, !profile?.first_name);
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  clearPendingPhone();

  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({
    ...session,
    needsOnboarding: false,
  }));
}

const completeOnboardingImpl = async (firstName: string, lastName: string): Promise<void> => {
  const session = getStoredSession();
  if (!session) return;

  await upsertProfileOnboarding(
    session.phoneNumber,
    {
      first_name: firstName,
      last_name: lastName,
      username: `${firstName}${lastName}`.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 24) || undefined,
    },
    session.accessToken,
  );

  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({
    ...session,
    needsOnboarding: false,
  }));
};

export { completeOnboardingImpl as completeOnboarding };

export function signOut(): void {
  const session = getStoredSession();
  if (session?.accessToken) {
    void signOutSupabase(session.accessToken);
  }

  localStorage.removeItem(SESSION_STORAGE_KEY);
  clearPendingPhone();
}
