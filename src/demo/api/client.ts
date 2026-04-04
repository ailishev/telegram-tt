const SUPABASE_URL_RAW = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

function resolveSupabaseRestBaseUrl() {
  if (!SUPABASE_URL_RAW) {
    return undefined;
  }

  if (SUPABASE_URL_RAW.startsWith('http://') || SUPABASE_URL_RAW.startsWith('https://')) {
    return SUPABASE_URL_RAW.replace(/\/$/, '');
  }

  if (SUPABASE_URL_RAW.startsWith('postgresql://') || SUPABASE_URL_RAW.startsWith('postgres://')) {
    try {
      const parsed = new URL(SUPABASE_URL_RAW);
      const apiHost = parsed.hostname.replace(/^db\./, '');
      return `https://${apiHost}`;
    } catch {
      return undefined;
    }
  }

  return undefined;
}

const SUPABASE_REST_BASE_URL = resolveSupabaseRestBaseUrl();

function getHeaders() {
  return {
    apikey: SUPABASE_ANON_KEY!,
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
  };
}

export function isDemoApiConfigured() {
  return Boolean(SUPABASE_REST_BASE_URL && SUPABASE_ANON_KEY);
}

export async function selectRows<T>(table: string, query = '*') {
  const url = `${SUPABASE_REST_BASE_URL}/rest/v1/${table}?select=${encodeURIComponent(query)}`;
  const response = await fetch(url, { headers: getHeaders() });
  if (!response.ok) {
    throw new Error(`Select failed for ${table}`);
  }

  return response.json() as Promise<T[]>;
}

export async function insertRow<T extends object>(table: string, body: T) {
  const url = `${SUPABASE_REST_BASE_URL}/rest/v1/${table}`;
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
