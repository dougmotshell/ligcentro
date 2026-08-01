import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { isSupabaseAuthConfigured, signUp, type AuthCredentials } from '@/adapters/auth';
import { applySessionCookies, toPublicSession } from '@/lib/auth/session';
import { getDb } from '@/lib/db/client';
import { normalizeHandle, validateHandle } from '@/lib/handle/validate';
import { DEFAULT_THEME_JSON } from '@/lib/theme/presets';

function displayNameFromHandle(handle: string): string {
  const name = handle
    .split(/[-_]/g)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');

  return name || handle;
}

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

  const useSupabase = isSupabaseAuthConfigured();
  const profileId = randomUUID();

  let result;
  try {
    result = await signUp({
      email,
      password,
      handle,
      userId: useSupabase ? undefined : randomUUID(),
      profileId,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'request_failed' },
      { status: 400 }
    );
  }

  // O perfil é criado mesmo quando a confirmação de e-mail está pendente: sem
  // isso o handle não fica reservado e o usuário perde o nome escolhido entre o
  // cadastro e o clique no link do e-mail.
  const inserted = (await db`
    INSERT INTO profiles (id, user_id, handle, display_name, bio, avatar_url, theme, status)
    VALUES (
      ${profileId}::uuid,
      ${result.userId}::uuid,
      ${handle},
      ${displayNameFromHandle(handle)},
      ${null},
      ${null},
      ${DEFAULT_THEME_JSON}::jsonb,
      'draft'
    )
    ON CONFLICT (user_id) DO NOTHING
    RETURNING id
  `) as unknown as Array<{ id: string }>;

  // Nada inserido = este usuário de auth já tem perfil. O Supabase responde com
  // objeto de usuário também para e-mail já cadastrado, então sem esta checagem
  // a rota afirmaria ter reservado um handle que continua livre para outra
  // pessoa — e o titular acharia que o nome é dele.
  if (!inserted[0]) {
    return NextResponse.json({ error: 'account_already_exists' }, { status: 409 });
  }

  if (!result.session) {
    return NextResponse.json({ pendingEmailConfirmation: true, handle }, { status: 202 });
  }

  const response = NextResponse.json(
    { user: toPublicSession(result.session), pendingEmailConfirmation: false },
    { status: 201 }
  );
  applySessionCookies(response, result.session);

  return response;
}
