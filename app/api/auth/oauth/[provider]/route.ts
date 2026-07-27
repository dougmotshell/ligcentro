import { createHash, randomBytes } from 'node:crypto';
import { NextResponse } from 'next/server';

const PROVIDERS = new Set(['google', 'github']);
const ONE_HOUR = 60 * 60;

function base64url(value: Buffer): string {
  return value.toString('base64url');
}

export async function GET(request: Request, context: { params: Promise<{ provider: string }> }) {
  const { provider } = await context.params;
  if (!PROVIDERS.has(provider)) return NextResponse.json({ error: 'provider_not_supported' }, { status: 404 });

  const url = new URL(request.url);
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) return NextResponse.json({ error: 'supabase_not_configured' }, { status: 503 });

  const verifier = base64url(randomBytes(32));
  const state = base64url(randomBytes(24));
  const challenge = base64url(createHash('sha256').update(verifier).digest());
  const callbackUrl = new URL('/api/auth/oauth/callback', url.origin);
  callbackUrl.searchParams.set('oauth_state', state);
  const authorize = new URL(`${supabaseUrl.replace(/\/$/, '')}/auth/v1/authorize`);
  authorize.searchParams.set('provider', provider);
  authorize.searchParams.set('redirect_to', callbackUrl.toString());
  authorize.searchParams.set('code_challenge', challenge);
  authorize.searchParams.set('code_challenge_method', 'S256');

  const response = NextResponse.redirect(authorize);
  const secure = process.env.NODE_ENV === 'production';
  response.cookies.set('oauth-code-verifier', verifier, { httpOnly: true, sameSite: 'lax', secure, path: '/', maxAge: ONE_HOUR });
  response.cookies.set('oauth-state', state, { httpOnly: true, sameSite: 'lax', secure, path: '/', maxAge: ONE_HOUR });
  response.cookies.set('oauth-locale', url.searchParams.get('locale') === 'en-US' ? 'en-US' : 'pt-BR', {
    httpOnly: true,
    sameSite: 'lax',
    secure,
    path: '/',
    maxAge: ONE_HOUR,
  });
  return response;
}
