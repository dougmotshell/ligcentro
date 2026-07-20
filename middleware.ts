import { NextRequest, NextResponse } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

const intlMiddleware = createMiddleware(routing);

/**
 * Middleware de internacionalização + proteção básica do dashboard.
 * Em desenvolvimento local, a sessão mock é indicada pelo cookie `mock-auth`.
 */
export default function middleware(request: NextRequest) {
  const segments = request.nextUrl.pathname.split('/').filter(Boolean);
  const maybeLocale = segments[0];

  if (segments.length === 1 && !routing.locales.includes(maybeLocale as (typeof routing.locales)[number])) {
    const localizedUrl = request.nextUrl.clone();
    localizedUrl.pathname = `/${routing.defaultLocale}/${maybeLocale}`;
    return NextResponse.rewrite(localizedUrl);
  }

  const isLocalizedDashboard =
    routing.locales.includes(maybeLocale as (typeof routing.locales)[number]) && segments[1] === 'dashboard';

  if (isLocalizedDashboard && !request.cookies.get('mock-auth')?.value) {
    const loginUrl = new URL(`/${maybeLocale}/login`, request.url);
    loginUrl.searchParams.set('redirectTo', request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
