const API_BASE_URL = process.env.APP_API_BASE_URL || '';

export async function backendFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
    ...init,
  });

  if (!response.ok) {
    throw new Error(`Backend request failed: ${path}`);
  }

  return response.json() as Promise<T>;
}
