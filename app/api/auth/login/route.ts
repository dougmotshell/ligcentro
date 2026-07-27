import { NextResponse } from 'next/server';
import { signIn, getMockSessionCookieValue, type AuthCredentials } from '@/adapters/auth';

const ONE_WEEK = 60 * 60 * 24 * 7;

export async function POST(request: Request) {
  const body = (await request.json()) as Partial<AuthCredentials>;

  if (!body.email || !body.password) {
    return NextResponse.json({ error: 'missing_fields' }, { status: 400 });
  }

  let session;
  try {
    session = await signIn({ email: body.email, password: body.password });
  } catch {
    return NextResponse.json({ error: 'request_failed' }, { status: 401 });
  }

  const response = NextResponse.json({ user: session });
  const isSupabase = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);
  response.cookies.set({
    name: isSupabase ? 'sb-access-token' : 'mock-auth',
    value: isSupabase ? session.accessToken ?? '' : getMockSessionCookieValue(session),
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: ONE_WEEK,
  });

  return response;
}
