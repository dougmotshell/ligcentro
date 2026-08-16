import { NextRequest, NextResponse } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import {
  ACCESS_TOKEN_COOKIE,
  EXPIRES_AT_COOKIE,
  MOCK_AUTH_COOKIE,
  REFRESH_TOKEN_COOKIE,
  SESSION_COOKIE_NAMES,
  clearedCookieOptions,
  parseExpiresAt,
  sessionCookieOptions,
  shouldRefresh,
} from './lib/auth/cookies';
import { requestRefreshedTokens, type RefreshedTokens } from './lib/auth/refresh';
import { isMockAuthAllowed } from './lib/auth/mock-allowed';

const intlMiddleware = createMiddleware(routing);

function isLocale(segment: string | undefined): boolean {
  return routing.locales.includes(segment as (typeof routing.locales)[number]);
}

/**
 * Middleware de internacionalização + sessão.
 *
 * Além de proteger o dashboard, é aqui que o access token do Supabase é
 * renovado: a navegação passa por este ponto e a resposta é gravável, então a
 * sessão sobrevive à expiração de uma hora do token sem o usuário perceber.
 * Em desenvolvimento local a sessão mock é indicada pelo cookie `mock-auth`.
 */
export default async function middleware(request: NextRequest) {
  const segments = request.nextUrl.pathname.split('/').filter(Boolean);
  const maybeLocale = segments[0];

  if (segments.length === 1 && !isLocale(maybeLocale)) {
    const localizedUrl = request.nextUrl.clone();
    localizedUrl.pathname = `/${routing.defaultLocale}/${maybeLocale}`;
    return NextResponse.rewrite(localizedUrl);
  }

  const isLocalizedDashboard = isLocale(maybeLocale) && segments[1] === 'dashboard';

  // O cookie mock só conta como sessão onde a sessão mock é permitida. Sem esta
  // checagem, um cookie forjado passava pelo middleware em produção e o erro só
  // aparecia na camada de dados — como 500 opaco em vez de "entre novamente"
  // (auditoria TCK-0023). O acesso em si nunca foi concedido; o que faltava era
  // a defesa em profundidade responder a coisa certa.
  const mockCookie = isMockAuthAllowed() ? request.cookies.get(MOCK_AUTH_COOKIE)?.value : undefined;
  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;
  const expiresAt = parseExpiresAt(request.cookies.get(EXPIRES_AT_COOKIE)?.value);

  let hasSession = Boolean(mockCookie || accessToken);
  let renewed: RefreshedTokens | null = null;
  let sessionIsDead = false;

  if (accessToken && shouldRefresh(expiresAt, Math.floor(Date.now() / 1000))) {
    renewed = refreshToken ? await requestRefreshedTokens(refreshToken) : null;

    if (!renewed) {
      // Token vencido e sem renovação possível: a sessão acabou de verdade.
      hasSession = false;
      sessionIsDead = true;
    }
  }

  const response =
    isLocalizedDashboard && !hasSession
      ? redirectToLogin(request, maybeLocale)
      : intlMiddleware(request);

  if (renewed) {
    response.cookies.set({
      name: ACCESS_TOKEN_COOKIE,
      value: renewed.accessToken,
      ...sessionCookieOptions(),
    });

    if (renewed.refreshToken) {
      response.cookies.set({
        name: REFRESH_TOKEN_COOKIE,
        value: renewed.refreshToken,
        ...sessionCookieOptions(),
      });
    }

    if (renewed.expiresAt) {
      response.cookies.set({
        name: EXPIRES_AT_COOKIE,
        value: String(renewed.expiresAt),
        ...sessionCookieOptions(),
      });
    }
  }

  if (sessionIsDead) {
    for (const name of SESSION_COOKIE_NAMES) {
      response.cookies.set({ name, value: '', ...clearedCookieOptions() });
    }
  }

  return response;
}

function redirectToLogin(request: NextRequest, locale: string | undefined): NextResponse {
  const loginUrl = new URL(`/${locale ?? routing.defaultLocale}/login`, request.url);
  loginUrl.searchParams.set('redirectTo', request.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
