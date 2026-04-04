import { insertRow, isDemoApiConfigured, selectRows, updateRows } from './client';

type DemoProfileRow = {
  id: string;
  auth_user_id?: string;
  phone_number?: string;
  first_name?: string;
  last_name?: string;
  username?: string;
  bio?: string;
};

type OnboardingPayload = {
  first_name: string;
  last_name?: string;
  username?: string;
  bio?: string;
};

export async function getProfileByPhone(phoneNumber: string, accessToken?: string) {
  if (!isDemoApiConfigured()) {
    return undefined;
  }

  const profiles = await selectRows<DemoProfileRow>('profiles', '*', `phone_number=eq.${encodeURIComponent(phoneNumber)}`, accessToken);
  return profiles[0];
}

export async function ensureDemoProfile(phoneNumber: string, authUserId?: string, accessToken?: string) {
  if (!isDemoApiConfigured()) {
    return;
  }

  try {
    const normalizedPhone = phoneNumber.replace(/\s+/g, '');
    const existing = await getProfileByPhone(normalizedPhone, accessToken);
    if (existing) {
      if (!existing.auth_user_id && authUserId) {
        await updateRows('profiles', {
          auth_user_id: authUserId,
        }, `id=eq.${existing.id}`, accessToken);
      }
      return existing;
    }

    await insertRow('profiles', {
      auth_user_id: authUserId,
      phone_number: normalizedPhone,
      first_name: '',
      last_name: '',
      username: `user_${Date.now()}`,
      display_name: '',
    }, accessToken);
  } catch {
    // Keep mocked flow functional even if profile endpoint is unavailable.
  }

  return undefined;
}

export async function upsertProfileOnboarding(phoneNumber: string, payload: OnboardingPayload, accessToken?: string) {
  const existing = await getProfileByPhone(phoneNumber, accessToken);
  if (existing) {
    await updateRows('profiles', {
      ...payload,
      display_name: [payload.first_name, payload.last_name].filter(Boolean).join(' ').trim(),
    }, `id=eq.${existing.id}`, accessToken);
    return;
  }

  await insertRow('profiles', {
    phone_number: phoneNumber,
    ...payload,
    display_name: [payload.first_name, payload.last_name].filter(Boolean).join(' ').trim(),
  }, accessToken);
}
