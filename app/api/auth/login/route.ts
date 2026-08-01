import { NextResponse } from 'next/server';
import { signIn, type AuthCredentials } from '@/adapters/auth';
import { applySessionCookies, toPublicSession } from '@/lib/auth/session';

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

  // O token vive só no cookie httpOnly — a resposta leva o recorte público.
  const response = NextResponse.json({ user: toPublicSession(session) });
  applySessionCookies(response, session);

  return response;
}
