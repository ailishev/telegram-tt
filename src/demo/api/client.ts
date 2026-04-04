const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

function getHeaders() {
  return {
    apikey: SUPABASE_ANON_KEY!,
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
  };
}

export function isDemoApiConfigured() {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

export async function selectRows<T>(table: string, query = '*') {
  const url = `${SUPABASE_URL}/rest/v1/${table}?select=${encodeURIComponent(query)}`;
  const response = await fetch(url, { headers: getHeaders() });
  if (!response.ok) {
    throw new Error(`Select failed for ${table}`);
  }

  return response.json() as Promise<T[]>;
}

export async function insertRow<T extends object>(table: string, body: T) {
  const url = `${SUPABASE_URL}/rest/v1/${table}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      ...getHeaders(),
      Prefer: 'return=representation',
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(`Insert failed for ${table}`);
  }

  return response.json();
}
