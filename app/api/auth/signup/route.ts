import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { getMockSessionCookieValue, signUp, type AuthCredentials } from '@/adapters/auth';
import { getDb } from '@/lib/db/client';
import { normalizeHandle, validateHandle } from '@/lib/handle/validate';

const ONE_WEEK = 60 * 60 * 24 * 7;

export async function POST(request: Request) {
  const body = (await request.json()) as Partial<AuthCredentials>;
  const email = body.email?.trim().toLowerCase();
  const password = body.password?.trim();
  const handle = normalizeHandle(body.handle ?? '');
  const validation = validateHandle(handle);

  if (!email || !password || !validation.valid) {
    return NextResponse.json({ error: validation.error ?? 'missing_fields' }, { status: 400 });
  }

  const db = getDb();
  const existingHandle = await db<{ exists: boolean }[]>`
    SELECT EXISTS(
      SELECT 1 FROM profiles WHERE handle = ${handle}
    ) AS exists
  `;

  if (existingHandle[0]?.exists) {
    return NextResponse.json({ error: 'handle_taken' }, { status: 409 });
  }

  const useSupabase = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const userId = useSupabase ? null : randomUUID();
  const profileId = randomUUID();
  const displayName = handle
    .split(/[-_]/g)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');

  let session;
  try {
    session = await signUp({ email, password, handle, userId: userId ?? undefined, profileId });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'request_failed' }, { status: 400 });
  }

  const resolvedUserId = session.id;
  await db`
    INSERT INTO profiles (id, user_id, handle, display_name, bio, avatar_url, theme, status)
    VALUES (
      ${profileId}::uuid,
      ${resolvedUserId}::uuid,
      ${handle},
      ${displayName || handle},
      ${null},
      ${null},
      ${JSON.stringify({ name: 'default', bg: '#ffffff', btnBg: '#1f2937', btnText: '#ffffff' })}::jsonb,
      'draft'
    )
  `;

  const response = NextResponse.json({ user: session }, { status: 201 });
  response.cookies.set({
    name: useSupabase ? 'sb-access-token' : 'mock-auth',
    value: useSupabase ? session.accessToken ?? '' : getMockSessionCookieValue(session),
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: ONE_WEEK,
  });

  return response;
}
