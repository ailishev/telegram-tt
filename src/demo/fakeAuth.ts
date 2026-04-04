export type DemoSession = {
  userId: number;
  username: string;
};

const SESSION_STORAGE_KEY = 'demo.local.session';

const TEST_USERNAME = 'test';
const TEST_PASSWORD = 'test123';

export function getStoredSession(): DemoSession | undefined {
  const rawSession = localStorage.getItem(SESSION_STORAGE_KEY);
  if (!rawSession) {
    return undefined;
  }

  try {
    const parsedSession = JSON.parse(rawSession) as Partial<DemoSession>;
    if (parsedSession.userId === 1 && parsedSession.username === TEST_USERNAME) {
      return {
        userId: 1,
        username: TEST_USERNAME,
      };
    }
  } catch {
    localStorage.removeItem(SESSION_STORAGE_KEY);
  }

  return undefined;
}

export function signIn(username: string, password: string): DemoSession | undefined {
  const normalizedUsername = username.trim();

  if (normalizedUsername !== TEST_USERNAME || password !== TEST_PASSWORD) {
    return undefined;
  }

  const session: DemoSession = {
    userId: 1,
    username: TEST_USERNAME,
  };

  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));

  return session;
}

export function signOut() {
  localStorage.removeItem(SESSION_STORAGE_KEY);
}

export function getTestCredentials() {
  return {
    username: TEST_USERNAME,
    password: TEST_PASSWORD,
  };
}
