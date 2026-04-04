import { insertRow, isDemoApiConfigured, selectRows } from './client';

type DemoUserRow = {
  id: number;
  phone?: string;
  first_name?: string;
  last_name?: string;
  username?: string;
  is_current?: boolean;
};

export async function ensureDemoProfile(phoneNumber: string) {
  if (!isDemoApiConfigured()) {
    return;
  }

  try {
    const users = await selectRows<DemoUserRow>('users', '*');
    const normalizedPhone = phoneNumber.replace(/\s+/g, '');

    const existing = users.find((user) => user.phone === normalizedPhone);
    if (existing) {
      return;
    }

    await insertRow('users', {
      phone: normalizedPhone,
      first_name: 'Test',
      last_name: 'User',
      username: `testuser_${Date.now()}`,
      is_current: true,
    });
  } catch {
    // Keep mocked flow functional even if profile endpoint is unavailable.
  }
}
