export const SUPABASE_URL_RAW = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
export const APP_API_BASE_URL = process.env.APP_API_BASE_URL;

export function resolveSupabaseRestBaseUrl(supabaseUrlRaw: string | undefined = SUPABASE_URL_RAW) {
  if (!supabaseUrlRaw) {
    return undefined;
  }

  if (supabaseUrlRaw.startsWith('http://') || supabaseUrlRaw.startsWith('https://')) {
    return supabaseUrlRaw.replace(/\/$/, '');
  }

  if (supabaseUrlRaw.startsWith('postgresql://') || supabaseUrlRaw.startsWith('postgres://')) {
    try {
      const parsed = new URL(supabaseUrlRaw);
      const apiHost = parsed.hostname.replace(/^db\./, '');
      return `https://${apiHost}`;
    } catch {
      return undefined;
    }
  }

  return undefined;
}

const SUPABASE_REST_BASE_URL = resolveSupabaseRestBaseUrl();

function getHeaders(accessToken?: string) {
  return {
    apikey: SUPABASE_ANON_KEY!,
    Authorization: `Bearer ${accessToken || SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
  };
}

export function isDemoApiConfigured() {
  return Boolean(SUPABASE_REST_BASE_URL && SUPABASE_ANON_KEY);
}

export async function selectRows<T>(table: string, query = '*', filters = '', accessToken?: string) {
  const search = filters ? `&${filters}` : '';
  const url = `${SUPABASE_REST_BASE_URL}/rest/v1/${table}?select=${encodeURIComponent(query)}${search}`;
  const response = await fetch(url, { headers: getHeaders(accessToken) });
  if (!response.ok) {
    throw new Error(`Select failed for ${table}`);
  }

  return response.json() as Promise<T[]>;
}

export async function insertRow<T extends object>(table: string, body: T, accessToken?: string) {
  const url = `${SUPABASE_REST_BASE_URL}/rest/v1/${table}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      ...getHeaders(accessToken),
      Prefer: 'return=representation',
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(`Insert failed for ${table}`);
  }

  return response.json();
}

export async function updateRows<T extends object>(table: string, body: T, filters: string, accessToken?: string) {
  const url = `${SUPABASE_REST_BASE_URL}/rest/v1/${table}?${filters}`;
  const response = await fetch(url, {
    method: 'PATCH',
    headers: {
      ...getHeaders(accessToken),
      Prefer: 'return=representation',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Update failed for ${table}`);
  }

  return response.json();
}
