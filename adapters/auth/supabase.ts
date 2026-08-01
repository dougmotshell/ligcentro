import type { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies';
import type { AuthCredentials, AuthSession, SignUpResult } from './mock';
import { getDb } from '@/lib/db/client';
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from '@/lib/auth/cookies';
import { requestRefreshedTokens, type RefreshedTokens } from '@/lib/auth/refresh';
import { resolveSupabaseAuthConfig } from '@/lib/supabase/config';

type SupabaseUser = { id: string; email?: string };

/** Tipos de verificação aceitos no link enviado por e-mail pelo Supabase. */
export const EMAIL_VERIFY_TYPES = [
  'signup',
  'email',
  'magiclink',
  'recovery',
  'invite',
  'email_change',
] as const;
export type EmailVerifyType = (typeof EMAIL_VERIFY_TYPES)[number];

function config() {
  const resolved = resolveSupabaseAuthConfig();
  if (!resolved) throw new Error('Supabase Auth não configurado.');
  return { url: resolved.url, key: resolved.anonKey };
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

function resolveExpiresAt(body: Record<string, unknown>): number | null {
  if (typeof body.expires_at === 'number') return body.expires_at;
  if (typeof body.expires_in === 'number') return Math.floor(Date.now() / 1000) + body.expires_in;
  return null;
}

async function toSession(
  user: SupabaseUser,
  tokens: { accessToken: string; refreshToken?: string | null; expiresAt?: number | null }
): Promise<AuthSession> {
  const db = getDb();
  const rows = (await db`
    SELECT id, handle FROM profiles WHERE user_id = ${user.id}::uuid LIMIT 1
  `) as unknown as Array<{ id: string; handle: string }>;
  return {
    id: user.id,
    email: user.email ?? '',
    handle: rows[0]?.handle ?? '',
    profileId: rows[0]?.id,
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken ?? null,
    expiresAt: tokens.expiresAt ?? null,
  };
}

function sessionFromTokenBody(body: Record<string, unknown>): Promise<AuthSession> {
  return toSession(body.user as SupabaseUser, {
    accessToken: String(body.access_token),
    refreshToken: typeof body.refresh_token === 'string' ? body.refresh_token : null,
    expiresAt: resolveExpiresAt(body),
  });
}

export async function exchangeCodeForSession(code: string, verifier: string): Promise<AuthSession> {
  const body = await request('/token?grant_type=pkce', {
    method: 'POST',
    body: JSON.stringify({ auth_code: code, code_verifier: verifier }),
  });
  return sessionFromTokenBody(body);
}

/** Conclui a confirmação de e-mail (link do Supabase) e devolve a sessão pronta. */
export async function verifyEmailToken(
  tokenHash: string,
  type: EmailVerifyType
): Promise<AuthSession> {
  const body = await request('/verify', {
    method: 'POST',
    body: JSON.stringify({ token_hash: tokenHash, type }),
  });
  if (!body.access_token || !body.user) throw new Error('verification_failed');
  return sessionFromTokenBody(body);
}

/** Renova a sessão a partir do refresh token; `null` quando o refresh não vale mais. */
export async function refreshSession(refreshToken: string): Promise<AuthSession | null> {
  const tokens: RefreshedTokens | null = await requestRefreshedTokens(refreshToken);
  if (!tokens?.userId) return null;
  return toSession(
    { id: tokens.userId },
    {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresAt: tokens.expiresAt,
    }
  );
}

export async function getSession(
  cookieStore: Pick<ReadonlyRequestCookies, 'get'>
): Promise<AuthSession | null> {
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;
  if (!accessToken) return null;
  try {
    const body = await request('/user', { headers: { Authorization: `Bearer ${accessToken}` } });
    return toSession(body as SupabaseUser, {
      accessToken,
      refreshToken: cookieStore.get(REFRESH_TOKEN_COOKIE)?.value ?? null,
    });
  } catch {
    return null;
  }
}

export async function requireAuth(
  cookieStore: Pick<ReadonlyRequestCookies, 'get'>
): Promise<AuthSession> {
  const session = await getSession(cookieStore);
  if (!session) throw new Error('UNAUTHORIZED');
  return session;
}

export async function signIn(credentials: AuthCredentials): Promise<AuthSession> {
  const body = await request('/token?grant_type=password', {
    method: 'POST',
    body: JSON.stringify({ email: credentials.email, password: credentials.password }),
  });
  return sessionFromTokenBody(body);
}

/**
 * Cadastro. Com confirmação de e-mail ligada no Supabase, a resposta vem sem
 * token: o usuário existe, mas a sessão só nasce no callback de confirmação.
 * Devolvemos `pendingEmailConfirmation` em vez de lançar — o perfil precisa ser
 * criado de qualquer forma para o handle ficar reservado.
 */
export async function signUp(credentials: AuthCredentials): Promise<SignUpResult> {
  const body = await request('/signup', {
    method: 'POST',
    body: JSON.stringify({ email: credentials.email, password: credentials.password }),
  });

  const user = body.user as SupabaseUser | undefined;
  if (!user?.id) throw new Error('signup_failed');

  if (!body.access_token) {
    return { session: null, userId: user.id, pendingEmailConfirmation: true };
  }

  return {
    session: await sessionFromTokenBody(body),
    userId: user.id,
    pendingEmailConfirmation: false,
  };
}

/** Revoga o refresh token no Supabase; best-effort, o cookie é limpo pela rota. */
export async function signOut(accessToken?: string): Promise<void> {
  if (!accessToken) return;
  try {
    await request('/logout', {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  } catch {
    // Sessão já inválida no servidor — nada a fazer.
  }
}

export const supabaseAuthAdapter = {
  getSession,
  requireAuth,
  signIn,
  signUp,
  signOut,
  refreshSession,
};

export { ACCESS_TOKEN_COOKIE };

/**
 * Remove o usuário no provedor de auth (Admin API).
 *
 * Exige a service role key. Sem ela, devolve `false`: os dados de produto já
 * foram apagados e a rota registra a pendência, em vez de fingir sucesso — o
 * direito de eliminação não pode depender de uma variável de ambiente estar lá.
 */
export async function deleteAuthUser(userId: string): Promise<boolean> {
  const resolved = resolveSupabaseAuthConfig();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!resolved || !serviceRoleKey) {
    return false;
  }

  try {
    const response = await fetch(`${resolved.url}/auth/v1/admin/users/${userId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${serviceRoleKey}`,
        apikey: serviceRoleKey,
      },
      cache: 'no-store',
    });

    return response.ok;
  } catch {
    return false;
  }
}
