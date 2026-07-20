import type { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies';
import type { AuthCredentials, AuthSession } from './mock';

const notConfigured = () => {
  throw new Error('Supabase Auth ainda não foi configurado neste ambiente.');
};

export async function getSession(_cookieStore: Pick<ReadonlyRequestCookies, 'get'>): Promise<AuthSession | null> {
  return notConfigured();
}

export async function requireAuth(_cookieStore: Pick<ReadonlyRequestCookies, 'get'>): Promise<AuthSession> {
  return notConfigured();
}

export async function signIn(_credentials: AuthCredentials): Promise<AuthSession> {
  return notConfigured();
}

export async function signUp(_credentials: AuthCredentials): Promise<AuthSession> {
  return notConfigured();
}

export async function signOut(): Promise<void> {
  notConfigured();
}

export const supabaseAuthAdapter = {
  getSession,
  requireAuth,
  signIn,
  signUp,
  signOut,
};
