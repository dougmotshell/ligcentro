import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { exchangeCodeForSession } from '@/adapters/auth/supabase';
import { applySessionCookies } from '@/lib/auth/session';
import { clearedCookieOptions } from '@/lib/auth/cookies';
import { ensureDraftProfile } from '@/lib/db/provisioning';

const OAUTH_COOKIES = ['oauth-code-verifier', 'oauth-state', 'oauth-locale'] as const;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const cookieStore = await cookies();
  const locale = cookieStore.get('oauth-locale')?.value === 'en-US' ? 'en-US' : 'pt-BR';
  const state = cookieStore.get('oauth-state')?.value;
  const verifier = cookieStore.get('oauth-code-verifier')?.value;
  const code = url.searchParams.get('code');
  const returnedState = url.searchParams.get('oauth_state');
  if (!code || !state || !verifier || state !== returnedState) {
    return NextResponse.redirect(new URL(`/${locale}/login?error=oauth_state`, url.origin));
  }

  try {
    const session = await exchangeCodeForSession(code, verifier);
    const profile = await ensureDraftProfile(session);
    session.profileId = profile.id;
    session.handle = profile.handle;

    const response = NextResponse.redirect(new URL(`/${locale}/onboarding?step=1`, url.origin));
    applySessionCookies(response, session);
    for (const name of OAUTH_COOKIES) {
      response.cookies.set({ name, value: '', ...clearedCookieOptions() });
    }
    return response;
  } catch {
    return NextResponse.redirect(new URL(`/${locale}/login?error=oauth_failed`, url.origin));
  }
}
