import type { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies';

export const MOCK_AUTH_COOKIE = 'mock-auth';
export const MOCK_USER = {
  id: '00000000-0000-0000-0000-000000000001',
  email: 'demo@ligcentro.dev',
  handle: 'demo',
  profileId: '00000000-0000-0000-0000-000000000001',
};

export interface AuthSession {
  id: string;
  email: string;
  handle: string;
  profileId?: string;
}

export interface AuthCredentials {
  email: string;
  password: string;
  handle?: string;
  userId?: string;
  profileId?: string;
}

function encodeSession(session: AuthSession): string {
  return Buffer.from(JSON.stringify(session)).toString('base64url');
}

function decodeSession(value: string): AuthSession | null {
  try {
    const parsed = JSON.parse(Buffer.from(value, 'base64url').toString('utf8')) as AuthSession;

    if (!parsed.id || !parsed.email || !parsed.handle) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function getMockSessionCookieValue(session: AuthSession = MOCK_USER): string {
  if (
    session.id === MOCK_USER.id &&
    session.email === MOCK_USER.email &&
    session.handle === MOCK_USER.handle &&
    session.profileId === MOCK_USER.profileId
  ) {
    return 'true';
  }

  return encodeSession(session);
}

export async function getSession(cookieStore: Pick<ReadonlyRequestCookies, 'get'>): Promise<AuthSession | null> {
  const cookie = cookieStore.get(MOCK_AUTH_COOKIE);

  if (!cookie?.value) {
    return null;
  }

  if (cookie.value === 'true') {
    return MOCK_USER;
  }

  return decodeSession(cookie.value);
}

export async function requireAuth(cookieStore: Pick<ReadonlyRequestCookies, 'get'>): Promise<AuthSession> {
  const session = await getSession(cookieStore);

  if (!session) {
    throw new Error('UNAUTHORIZED');
  }

  return session;
}

export async function signIn(credentials: AuthCredentials): Promise<AuthSession> {
  return {
    id: credentials.userId ?? MOCK_USER.id,
    email: credentials.email,
    handle: credentials.handle ?? MOCK_USER.handle,
    profileId: credentials.profileId ?? MOCK_USER.profileId,
  };
}

export async function signUp(credentials: AuthCredentials): Promise<AuthSession> {
  return {
    id: credentials.userId ?? MOCK_USER.id,
    email: credentials.email,
    handle: credentials.handle ?? MOCK_USER.handle,
    profileId: credentials.profileId ?? MOCK_USER.profileId,
  };
}

export async function signOut(): Promise<void> {
  return;
}

export const mockAuthAdapter = {
  getSession,
  requireAuth,
  signIn,
  signUp,
  signOut,
};
