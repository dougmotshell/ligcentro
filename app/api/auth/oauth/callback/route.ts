import { randomUUID } from 'node:crypto';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { exchangeCodeForSession } from '@/adapters/auth/supabase';
import { applySessionCookies } from '@/lib/auth/session';
import { clearedCookieOptions } from '@/lib/auth/cookies';
import { getDb } from '@/lib/db/client';
import { DEFAULT_THEME_JSON } from '@/lib/theme/presets';

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
    const db = getDb();
    if (!session.profileId) {
      const profileId = randomUUID();
      const handle = `user-${session.id.slice(0, 8).toLowerCase()}`;
      // O ON CONFLICT depende do índice único de `profiles.user_id` criado na
      // migração 0005 — sem ele o Postgres aborta a inserção.
      await db`
        INSERT INTO profiles (id, user_id, handle, display_name, bio, theme, status)
        VALUES (${profileId}::uuid, ${session.id}::uuid, ${handle}, ${session.email || 'Novo usuário'}, NULL,
          ${DEFAULT_THEME_JSON}::jsonb, 'draft')
        ON CONFLICT (user_id) DO NOTHING
      `;
      session.profileId = profileId;
      session.handle = handle;
    }
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
