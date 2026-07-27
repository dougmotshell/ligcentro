import type { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies';
import type { AuthCredentials, AuthSession } from './mock';
import { getDb } from '@/lib/db/client';

const ACCESS_TOKEN_COOKIE = 'sb-access-token';

type SupabaseUser = { id: string; email?: string };

function config() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Supabase Auth não configurado.');
  return { url: url.replace(/\/$/, ''), key };
}

async function request(path: string, init: RequestInit = {}) {
  const { url, key } = config();
  const response = await fetch(`${url}/auth/v1${path}`, {
    ...init,
    headers: { apikey: key, 'Content-Type': 'application/json', ...(init.headers ?? {}) },
    cache: 'no-store',
  });
  const body = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  if (!response.ok) throw new Error(String(body.error_code ?? body.error ?? 'auth_request_failed'));
  return body;
}

async function toSession(user: SupabaseUser, accessToken: string): Promise<AuthSession> {
  const db = getDb();
  const rows = (await db`
    SELECT id, handle FROM profiles WHERE user_id = ${user.id}::uuid LIMIT 1
  `) as unknown as Array<{ id: string; handle: string }>;
  return {
    id: user.id,
    email: user.email ?? '',
    handle: rows[0]?.handle ?? '',
    profileId: rows[0]?.id,
    accessToken,
  };
}

export async function getSession(cookieStore: Pick<ReadonlyRequestCookies, 'get'>): Promise<AuthSession | null> {
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;
  if (!accessToken) return null;
  try {
    const body = await request('/user', { headers: { Authorization: `Bearer ${accessToken}` } });
    return toSession(body as SupabaseUser, accessToken);
  } catch {
    return null;
  }
}

export async function requireAuth(cookieStore: Pick<ReadonlyRequestCookies, 'get'>): Promise<AuthSession> {
  const session = await getSession(cookieStore);
  if (!session) throw new Error('UNAUTHORIZED');
  return session;
}

export async function signIn(credentials: AuthCredentials): Promise<AuthSession> {
  const body = await request('/token?grant_type=password', {
    method: 'POST',
    body: JSON.stringify({ email: credentials.email, password: credentials.password }),
  });
  return toSession(body.user as SupabaseUser, String(body.access_token));
}

export async function signUp(credentials: AuthCredentials): Promise<AuthSession> {
  const body = await request('/signup', {
    method: 'POST',
    body: JSON.stringify({ email: credentials.email, password: credentials.password }),
  });
  if (!body.access_token || !body.user) throw new Error('email_confirmation_required');
  return toSession(body.user as SupabaseUser, String(body.access_token));
}

export async function signOut(): Promise<void> {
  // O cookie é removido pelo Route Handler; a revogação remota é best-effort.
  return;
}

export const supabaseAuthAdapter = {
  getSession,
  requireAuth,
  signIn,
  signUp,
  signOut,
};

export { ACCESS_TOKEN_COOKIE };
