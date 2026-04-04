import { resolveSupabaseRestBaseUrl, SUPABASE_URL_RAW } from './client';

const SUPABASE_URL = resolveSupabaseRestBaseUrl(SUPABASE_URL_RAW);
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const DEMO_AUTH_PASSWORD = process.env.APP_DEMO_AUTH_PASSWORD || 'telegram_tt_dev_password';

export type SupabaseSession = {
  access_token: string;
  refresh_token: string;
  expires_at?: number;
  user: {
    id: string;
    phone?: string;
    email?: string;
  };
};

function getHeaders(accessToken?: string) {
  return {
    apikey: SUPABASE_ANON_KEY!,
    Authorization: accessToken ? `Bearer ${accessToken}` : `Bearer ${SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
  };
}

function toEmail(phoneNumber: string) {
  const normalized = phoneNumber.replace(/[^\d]/g, '');
  return `phone_${normalized}@local.telegram-tt.dev`;
}

async function signInWithPassword(email: string): Promise<SupabaseSession | undefined> {
  const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ email, password: DEMO_AUTH_PASSWORD }),
  });

  if (!response.ok) {
    return undefined;
  }

  return response.json() as Promise<SupabaseSession>;
}

async function signUp(email: string, phoneNumber: string): Promise<SupabaseSession> {
  const response = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      email,
      password: DEMO_AUTH_PASSWORD,
      options: {
        data: {
          phone_number: phoneNumber,
        },
        emailRedirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(`Failed to sign up: ${errorText || response.statusText}`);
  }

  return response.json() as Promise<SupabaseSession>;
}

export async function signInOrSignUpByPhone(phoneNumber: string): Promise<SupabaseSession> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Supabase is not configured. Please set SUPABASE_URL and SUPABASE_ANON_KEY.');
  }

  const email = toEmail(phoneNumber);
  const signedIn = await signInWithPassword(email);
  if (signedIn?.access_token) {
    return signedIn;
  }

  const signedUp = await signUp(email, phoneNumber);
  if (signedUp.access_token) {
    return signedUp;
  }

  const retrySignedIn = await signInWithPassword(email);
  if (!retrySignedIn?.access_token) {
    throw new Error('Unable to create Supabase session');
  }

  return retrySignedIn;
}

export async function signOutSupabase(accessToken: string) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return;
  }

  await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
    method: 'POST',
    headers: getHeaders(accessToken),
  });
}
