import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { signOut } from '@/adapters/auth';
import { ACCESS_TOKEN_COOKIE } from '@/lib/auth/cookies';
import { clearSessionCookies } from '@/lib/auth/session';

export async function POST() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;

  // Revoga no provedor (best-effort) e derruba toda forma de sessão local.
  await signOut(accessToken);

  const response = NextResponse.json({ ok: true });
  clearSessionCookies(response);

  return response;
}
