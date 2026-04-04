export type DemoSession = {
  userId: number;
  phoneNumber: string;
};

const SESSION_STORAGE_KEY = 'demo.local.session';

const TEST_PHONE_NUMBER = '+10000000000';
const TEST_CODE = '11111';

function normalizePhoneNumber(phoneNumber: string) {
  return `+${phoneNumber.replace(/[^\d]/g, '')}`;
}

export function getStoredSession(): DemoSession | undefined {
  const rawSession = localStorage.getItem(SESSION_STORAGE_KEY);
  if (!rawSession) {
    return undefined;
  }

  try {
    const parsedSession = JSON.parse(rawSession) as Partial<DemoSession>;
    if (parsedSession.userId === 1 && typeof parsedSession.phoneNumber === 'string') {
      return {
        userId: 1,
        phoneNumber: parsedSession.phoneNumber,
      };
    }
  } catch {
    localStorage.removeItem(SESSION_STORAGE_KEY);
  }

  return undefined;
}

export function isAllowedDemoPhone(phoneNumber: string) {
  return normalizePhoneNumber(phoneNumber) === TEST_PHONE_NUMBER;
}

export function verifyDemoCode(code: string) {
  return code.trim() === TEST_CODE;
}

export function signInWithPhone(phoneNumber: string): DemoSession {
  const session: DemoSession = {
    userId: 1,
    phoneNumber: normalizePhoneNumber(phoneNumber),
  };

  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));

  return session;
}

export function signOut() {
  localStorage.removeItem(SESSION_STORAGE_KEY);
}

export function getTestCredentials() {
  return {
    phoneNumber: TEST_PHONE_NUMBER,
    code: TEST_CODE,
  };
}
