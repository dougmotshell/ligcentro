import type { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies';
import type { AuthCredentials, AuthSession, SignUpResult } from './mock';
import { isSupabaseAuthConfigured } from '@/lib/supabase/config';
import { isMockAuthAllowed } from '@/lib/auth/mock-allowed';
import { mockAuthAdapter } from './mock';
import { supabaseAuthAdapter } from './supabase';

interface AuthAdapter {
  getSession(cookieStore: Pick<ReadonlyRequestCookies, 'get'>): Promise<AuthSession | null>;
  requireAuth(cookieStore: Pick<ReadonlyRequestCookies, 'get'>): Promise<AuthSession>;
  signIn(credentials: AuthCredentials): Promise<AuthSession>;
  signUp(credentials: AuthCredentials): Promise<SignUpResult>;
  signOut(accessToken?: string): Promise<void>;
  refreshSession(refreshToken: string): Promise<AuthSession | null>;
}

export { isSupabaseAuthConfigured };

/**
 * O mock só é aceitável fora de produção. Em produção ele precisa de opt-in
 * explícito (`ALLOW_MOCK_AUTH=true`, usado pelo `docker compose` de QA, que roda
 * com `NODE_ENV=production` sem Supabase) — nunca por fallback silencioso, que
 * transformaria a falta de uma variável de ambiente em autenticação forjável.
 *
 * A regra mora em `lib/auth/mock-allowed` para o middleware (Edge) aplicar a
 * mesma decisão sem importar este módulo, que puxa o driver do banco.
 */
export { isMockAuthAllowed };

export function createAuthAdapter(): AuthAdapter {
  if (isSupabaseAuthConfigured()) {
    return supabaseAuthAdapter;
  }

  if (!isMockAuthAllowed()) {
    throw new Error(
      'auth_not_configured: defina SUPABASE_URL e SUPABASE_ANON_KEY, ou ALLOW_MOCK_AUTH=true para aceitar a sessão mock.'
    );
  }

  return mockAuthAdapter;
}

/** Verdadeiro quando a sessão em uso é a mock (define qual cookie gravar). */
export function isMockAuthActive(): boolean {
  return !isSupabaseAuthConfigured();
}

export async function getSession(cookieStore: Pick<ReadonlyRequestCookies, 'get'>) {
  return createAuthAdapter().getSession(cookieStore);
}

export async function requireAuth(cookieStore: Pick<ReadonlyRequestCookies, 'get'>) {
  return createAuthAdapter().requireAuth(cookieStore);
}

export async function signIn(credentials: AuthCredentials) {
  return createAuthAdapter().signIn(credentials);
}

export async function signUp(credentials: AuthCredentials) {
  return createAuthAdapter().signUp(credentials);
}

export async function signOut(accessToken?: string) {
  return createAuthAdapter().signOut(accessToken);
}

export async function refreshSession(refreshToken: string) {
  return createAuthAdapter().refreshSession(refreshToken);
}

export type { AuthCredentials, AuthSession, SignUpResult } from './mock';
export { MOCK_AUTH_COOKIE, MOCK_USER, getMockSessionCookieValue } from './mock';
