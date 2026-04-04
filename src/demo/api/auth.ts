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

const LOCAL_PROFILES_KEY = 'demo.local.profiles';

function getLocalProfiles() {
  try {
    const raw = localStorage.getItem(LOCAL_PROFILES_KEY);
    if (!raw) return [] as DemoProfileRow[];
    return JSON.parse(raw) as DemoProfileRow[];
  } catch {
    return [] as DemoProfileRow[];
  }
}

function saveLocalProfiles(profiles: DemoProfileRow[]) {
  localStorage.setItem(LOCAL_PROFILES_KEY, JSON.stringify(profiles));
}

function upsertLocalProfile(profile: DemoProfileRow) {
  const profiles = getLocalProfiles();
  const existingIndex = profiles.findIndex((item) => item.phone_number === profile.phone_number || item.id === profile.id);
  if (existingIndex >= 0) {
    profiles[existingIndex] = { ...profiles[existingIndex], ...profile };
  } else {
    profiles.push(profile);
  }
  saveLocalProfiles(profiles);
  return profiles.find((item) => item.phone_number === profile.phone_number || item.id === profile.id);
}

function getLocalProfileByPhone(phoneNumber: string) {
  return getLocalProfiles().find((profile) => profile.phone_number === phoneNumber);
}

export async function getProfileByPhone(phoneNumber: string, accessToken?: string) {
  if (!isDemoApiConfigured()) {
    return getLocalProfileByPhone(phoneNumber);
  }

  try {
    const profiles = await selectRows<DemoProfileRow>('profiles', '*', `phone_number=eq.${encodeURIComponent(phoneNumber)}`, accessToken);
    const profile = profiles[0];
    if (profile) {
      upsertLocalProfile(profile);
    }
    return profile;
  } catch {
    return getLocalProfileByPhone(phoneNumber);
  }
}

export async function ensureDemoProfile(phoneNumber: string, authUserId?: string, accessToken?: string) {
  const normalizedPhone = phoneNumber.replace(/\s+/g, '');

  const localProfile = upsertLocalProfile({
    id: `local_${normalizedPhone.replace(/[^\d]/g, '')}`,
    auth_user_id: authUserId,
    phone_number: normalizedPhone,
    first_name: getLocalProfileByPhone(normalizedPhone)?.first_name || '',
    last_name: getLocalProfileByPhone(normalizedPhone)?.last_name || '',
    username: getLocalProfileByPhone(normalizedPhone)?.username || `user_${Date.now()}`,
    bio: getLocalProfileByPhone(normalizedPhone)?.bio,
  });

  if (!isDemoApiConfigured()) {
    return localProfile;
  }

  try {
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
    // local profile already persisted above
  }

  return localProfile;
}

export async function upsertProfileOnboarding(phoneNumber: string, payload: OnboardingPayload, accessToken?: string) {
  const existingLocal = getLocalProfileByPhone(phoneNumber);
  upsertLocalProfile({
    id: existingLocal?.id || `local_${phoneNumber.replace(/[^\d]/g, '')}`,
    phone_number: phoneNumber,
    ...existingLocal,
    ...payload,
  });

  if (!isDemoApiConfigured()) {
    return;
  }

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
