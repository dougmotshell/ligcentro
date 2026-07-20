import { NextResponse } from 'next/server';
import { signIn, getMockSessionCookieValue, type AuthCredentials } from '@/adapters/auth';

const ONE_WEEK = 60 * 60 * 24 * 7;

export async function POST(request: Request) {
  const body = (await request.json()) as Partial<AuthCredentials>;

  if (!body.email || !body.password) {
    return NextResponse.json({ error: 'missing_fields' }, { status: 400 });
  }

  const session = await signIn({
    email: body.email,
    password: body.password,
  });

  const response = NextResponse.json({ user: session });
  response.cookies.set({
    name: 'mock-auth',
    value: getMockSessionCookieValue(session),
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: ONE_WEEK,
  });

  return response;
}
