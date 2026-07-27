import { randomUUID } from 'node:crypto';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { exchangeCodeForSession } from '@/adapters/auth/supabase';
import { getDb } from '@/lib/db/client';

const ONE_WEEK = 60 * 60 * 24 * 7;

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
    const db = getDb();
    if (!session.profileId) {
      const profileId = randomUUID();
      const handle = `user-${session.id.slice(0, 8).toLowerCase()}`;
      await db`
        INSERT INTO profiles (id, user_id, handle, display_name, bio, theme, status)
        VALUES (${profileId}::uuid, ${session.id}::uuid, ${handle}, ${session.email || 'Novo usuário'}, NULL,
          '{"name":"default","bg":"#ffffff","btnBg":"#1f2937","btnText":"#ffffff"}'::jsonb, 'draft')
        ON CONFLICT (user_id) DO NOTHING
      `;
    }
    const response = NextResponse.redirect(new URL(`/${locale}/onboarding?step=1`, url.origin));
    response.cookies.set('sb-access-token', session.accessToken ?? '', {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: ONE_WEEK,
    });
    for (const name of ['oauth-code-verifier', 'oauth-state', 'oauth-locale']) {
      response.cookies.set(name, '', { httpOnly: true, path: '/', maxAge: 0 });
    }
    return response;
  } catch {
    return NextResponse.redirect(new URL(`/${locale}/login?error=oauth_failed`, url.origin));
  }
}
