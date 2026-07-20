import type { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies';
import type { AuthCredentials, AuthSession } from './mock';

interface AuthAdapter {
  getSession(cookieStore: Pick<ReadonlyRequestCookies, 'get'>): Promise<AuthSession | null>;
  requireAuth(cookieStore: Pick<ReadonlyRequestCookies, 'get'>): Promise<AuthSession>;
  signIn(credentials: AuthCredentials): Promise<AuthSession>;
  signUp(credentials: AuthCredentials): Promise<AuthSession>;
  signOut(): Promise<void>;
}

export function createAuthAdapter(): AuthAdapter {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('./mock').mockAuthAdapter as AuthAdapter;
  }

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('./supabase').supabaseAuthAdapter as AuthAdapter;
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

export async function signOut() {
  return createAuthAdapter().signOut();
}

export type { AuthCredentials, AuthSession } from './mock';
export { MOCK_AUTH_COOKIE, MOCK_USER, getMockSessionCookieValue } from './mock';
