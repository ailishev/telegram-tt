import { ensureDemoProfile, getProfileByPhone, upsertProfileOnboarding } from './api/auth';
import { signInOrSignUpByPhone, signOutSupabase, type SupabaseSession } from './api/supabaseAuth';

export type DemoSession = {
  userId: string;
  phoneNumber: string;
  accessToken: string;
  refreshToken: string;
  expiresAt?: number;
  needsOnboarding?: boolean;
  isLocalFallback?: boolean;
};

const SESSION_STORAGE_KEY = 'demo.local.session';
const TEMP_PHONE_STORAGE_KEY = 'demo.local.pending_phone';

function normalizePhoneNumber(phoneNumber: string) {
  return `+${phoneNumber.replace(/[^\d]/g, '')}`;
}

function fromSupabaseSession(session: SupabaseSession, phoneNumber: string, needsOnboarding: boolean): DemoSession {
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
  if (!rawSession) {
    return undefined;
  }

  try {
    const parsedSession = JSON.parse(rawSession) as Partial<DemoSession>;
    if (typeof parsedSession.userId === 'string' && typeof parsedSession.phoneNumber === 'string' && parsedSession.accessToken) {
      return parsedSession as DemoSession;
    }
  } catch {
    localStorage.removeItem(SESSION_STORAGE_KEY);
  }

  return undefined;
}

export function setPendingPhone(phoneNumber: string) {
  localStorage.setItem(TEMP_PHONE_STORAGE_KEY, normalizePhoneNumber(phoneNumber));
}

export function getPendingPhone() {
  return localStorage.getItem(TEMP_PHONE_STORAGE_KEY) || undefined;
}

export function clearPendingPhone() {
  localStorage.removeItem(TEMP_PHONE_STORAGE_KEY);
}

export function isAllowedDemoPhone(phoneNumber: string) {
  return normalizePhoneNumber(phoneNumber).length >= 8;
}

export function verifyDemoCode(code: string) {
  return code.trim() === '11111';
}

export async function signInWithPhone(phoneNumber: string): Promise<DemoSession> {
  const normalizedPhone = normalizePhoneNumber(phoneNumber);
  try {
    const supabaseSession = await signInOrSignUpByPhone(normalizedPhone);
    await ensureDemoProfile(normalizedPhone, supabaseSession.user.id, supabaseSession.access_token);

    const profile = await getProfileByPhone(normalizedPhone, supabaseSession.access_token);
    const needsOnboarding = !profile?.first_name;

    const session = fromSupabaseSession(supabaseSession, normalizedPhone, needsOnboarding);
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    clearPendingPhone();

    return session;
  } catch (err) {
    const errorMessage = String(err);
    const isRateLimit = errorMessage.includes('over_email_send_rate_limit');
    if (!isRateLimit) {
      throw err;
    }

    await ensureDemoProfile(normalizedPhone);
    const profile = await getProfileByPhone(normalizedPhone);

    const fallbackSession: DemoSession = {
      userId: profile?.id || `local_${normalizedPhone.replace(/[^\d]/g, '')}`,
      phoneNumber: normalizedPhone,
      accessToken: '',
      refreshToken: '',
      needsOnboarding: !profile?.first_name,
      isLocalFallback: true,
    };

    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(fallbackSession));
    clearPendingPhone();
    return fallbackSession;
  }
}

async function completeOnboardingImpl(firstName: string, lastName: string) {
  const session = getStoredSession();
  if (!session) return;

  await upsertProfileOnboarding(session.phoneNumber, {
    first_name: firstName,
    last_name: lastName,
    username: `${firstName}${lastName}`.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 24) || undefined,
  }, session.accessToken || undefined);

  const updated: DemoSession = {
    ...session,
    needsOnboarding: false,
  };
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(updated));
}

export { completeOnboardingImpl as completeOnboarding };

export function signOut() {
  const session = getStoredSession();
  if (session) {
    void signOutSupabase(session.accessToken);
  }
  localStorage.removeItem(SESSION_STORAGE_KEY);
  clearPendingPhone();
}

export function getTestCredentials() {
  return {
    phoneNumber: '+10000000000',
    code: '11111',
    username: 'demo',
    password: 'demo',
  };
}

export function signIn(username: string, password: string) {
  if (username !== 'demo' || password !== 'demo') {
    return undefined;
  }

  const fallbackSession: DemoSession = {
    userId: 'demo-user',
    phoneNumber: '+10000000000',
    accessToken: 'demo-token',
    refreshToken: 'demo-refresh',
    needsOnboarding: false,
  };
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(fallbackSession));
  return fallbackSession;
}
