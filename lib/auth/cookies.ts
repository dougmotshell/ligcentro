/**
 * Ponto único de definição dos cookies de sessão.
 *
 * Nenhuma rota monta as opções na mão: `httpOnly` e `secure` precisam valer em
 * todo lugar, e o token de acesso nunca sai daqui para o cliente.
 * Este módulo é livre de dependências de Node/DB — o middleware (Edge) o importa.
 */

export const ACCESS_TOKEN_COOKIE = 'sb-access-token';
export const REFRESH_TOKEN_COOKIE = 'sb-refresh-token';
/** Expiração do access token em epoch (segundos). Não é segredo; serve ao middleware. */
export const EXPIRES_AT_COOKIE = 'sb-expires-at';
export const MOCK_AUTH_COOKIE = 'mock-auth';

export const SESSION_COOKIE_NAMES = [
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  EXPIRES_AT_COOKIE,
  MOCK_AUTH_COOKIE,
] as const;

export const SESSION_MAX_AGE_IN_SECONDS = 60 * 60 * 24 * 7;

/** Margem para renovar antes de o token expirar de fato. */
export const REFRESH_SKEW_IN_SECONDS = 60;

export interface SessionCookieOptions {
  httpOnly: true;
  sameSite: 'lax';
  secure: boolean;
  path: string;
  maxAge: number;
}

/**
 * `secure` só é dispensado fora de produção — em desenvolvimento o app roda em
 * http://localhost e o navegador descartaria o cookie.
 */
export function isSecureRuntime(): boolean {
  return process.env.NODE_ENV === 'production';
}

export function sessionCookieOptions(
  maxAge: number = SESSION_MAX_AGE_IN_SECONDS
): SessionCookieOptions {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: isSecureRuntime(),
    path: '/',
    maxAge,
  };
}

export function clearedCookieOptions(): SessionCookieOptions {
  return sessionCookieOptions(0);
}

/** Momento (epoch em segundos) em que o token deve ser renovado. */
export function shouldRefresh(expiresAt: number | null, nowInSeconds: number): boolean {
  if (!expiresAt) {
    return false;
  }

  return expiresAt - REFRESH_SKEW_IN_SECONDS <= nowInSeconds;
}

export function parseExpiresAt(value: string | undefined): number | null {
  if (!value) {
    return null;
  }

  const parsed = Number.parseInt(value, 10);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}
