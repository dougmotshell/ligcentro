import { cookies } from 'next/headers';
import type { NextResponse } from 'next/server';
import {
  getSession,
  isMockAuthActive,
  refreshSession,
  getMockSessionCookieValue,
  type AuthSession,
} from '@/adapters/auth';
import {
  ACCESS_TOKEN_COOKIE,
  EXPIRES_AT_COOKIE,
  MOCK_AUTH_COOKIE,
  REFRESH_TOKEN_COOKIE,
  SESSION_COOKIE_NAMES,
  clearedCookieOptions,
  sessionCookieOptions,
} from '@/lib/auth/cookies';

/** Recorte da sessão que pode ir para o cliente — nunca inclui token. */
export interface PublicSession {
  id: string;
  email: string;
  handle: string;
  profileId?: string;
}

export function toPublicSession(session: AuthSession): PublicSession {
  return {
    id: session.id,
    email: session.email,
    handle: session.handle,
    profileId: session.profileId,
  };
}

/**
 * Sessão para Route Handlers.
 *
 * Diferente de `getSession`, tenta **renovar** quando o access token já não é
 * aceito: aqui o cookie é gravável, então o usuário não é deslogado só porque o
 * token de uma hora venceu no meio do uso do editor.
 */
export async function resolveSession(): Promise<AuthSession | null> {
  const cookieStore = await cookies();

  let session: AuthSession | null;
  try {
    session = await getSession(cookieStore);
  } catch (error) {
    // Provedor de auth ausente (nem Supabase, nem mock autorizado). Para quem
    // chama, o resultado é o mesmo de não ter sessão — e a rota responde 401 em
    // vez de estourar 500 em toda requisição. A causa vai para o log do
    // servidor: má configuração silenciosa foi exatamente o que custou um ciclo
    // inteiro de investigação no TCK-0025.
    console.error(`[auth] sessão não pôde ser resolvida: ${(error as Error).message}`);
    return null;
  }

  if (session) {
    return session;
  }

  const refreshToken = cookieStore.get(REFRESH_TOKEN_COOKIE)?.value;

  if (!refreshToken || isMockAuthActive()) {
    return null;
  }

  const renewed = await refreshSession(refreshToken);

  if (!renewed) {
    clearSessionCookiesOnStore(cookieStore);
    return null;
  }

  writeSessionCookiesOnStore(cookieStore, renewed);

  return renewed;
}

type MutableCookieStore = Awaited<ReturnType<typeof cookies>>;

function writeSessionCookiesOnStore(cookieStore: MutableCookieStore, session: AuthSession): void {
  for (const cookie of sessionCookies(session)) {
    try {
      cookieStore.set(cookie);
    } catch {
      // Contexto somente-leitura (Server Component): o middleware renova na
      // próxima navegação.
      return;
    }
  }
}

function clearSessionCookiesOnStore(cookieStore: MutableCookieStore): void {
  for (const name of SESSION_COOKIE_NAMES) {
    try {
      cookieStore.set({ name, value: '', ...clearedCookieOptions() });
    } catch {
      return;
    }
  }
}

interface SessionCookie {
  name: string;
  value: string;
  httpOnly: true;
  sameSite: 'lax';
  secure: boolean;
  path: string;
  maxAge: number;
}

/**
 * Cookies que representam a sessão. No modo mock é um só; no Supabase são três
 * (acesso, renovação e a expiração que o middleware consulta).
 */
export function sessionCookies(session: AuthSession): SessionCookie[] {
  if (isMockAuthActive()) {
    return [
      {
        name: MOCK_AUTH_COOKIE,
        value: getMockSessionCookieValue(session),
        ...sessionCookieOptions(),
      },
    ];
  }

  const cookiesToSet: SessionCookie[] = [
    { name: ACCESS_TOKEN_COOKIE, value: session.accessToken ?? '', ...sessionCookieOptions() },
  ];

  if (session.refreshToken) {
    cookiesToSet.push({
      name: REFRESH_TOKEN_COOKIE,
      value: session.refreshToken,
      ...sessionCookieOptions(),
    });
  }

  if (session.expiresAt) {
    cookiesToSet.push({
      name: EXPIRES_AT_COOKIE,
      value: String(session.expiresAt),
      ...sessionCookieOptions(),
    });
  }

  return cookiesToSet;
}

/** Grava a sessão na resposta (rotas que devolvem `NextResponse`). */
export function applySessionCookies(response: NextResponse, session: AuthSession): void {
  for (const cookie of sessionCookies(session)) {
    response.cookies.set(cookie);
  }
}

/** Remove toda forma de sessão da resposta — usado no logout e na exclusão de conta. */
export function clearSessionCookies(response: NextResponse): void {
  for (const name of SESSION_COOKIE_NAMES) {
    response.cookies.set({ name, value: '', ...clearedCookieOptions() });
  }
}
