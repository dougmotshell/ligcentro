import { randomUUID } from 'node:crypto';
import { getDb } from '@/lib/db/client';
import { DEFAULT_THEME_JSON } from '@/lib/theme/presets';
import type { AuthSession } from '@/adapters/auth';

/**
 * Garante que um usuário autenticado tenha perfil.
 *
 * Usado pelos dois callbacks que criam conta sem passar pelo formulário de
 * cadastro (OAuth e confirmação de e-mail): sem perfil o onboarding e o
 * dashboard não têm o que editar, e o usuário fica preso numa tela que só sabe
 * criar conta nova.
 */
export async function ensureDraftProfile(
  session: AuthSession
): Promise<{ id: string; handle: string }> {
  const db = getDb();

  const existing = (await db`
    SELECT id, handle FROM profiles WHERE user_id = ${session.id}::uuid LIMIT 1
  `) as unknown as Array<{ id: string; handle: string }>;

  if (existing[0]) {
    return existing[0];
  }

  const profileId = randomUUID();
  // Handle provisório derivado do id do usuário; o onboarding é onde a pessoa
  // escolhe o definitivo.
  const handle = `user-${session.id.slice(0, 8).toLowerCase()}`;

  // O ON CONFLICT depende do índice único de `profiles.user_id` (migração 0005).
  const inserted = (await db`
    INSERT INTO profiles (id, user_id, handle, display_name, bio, theme, status)
    VALUES (
      ${profileId}::uuid,
      ${session.id}::uuid,
      ${handle},
      ${session.email || 'Novo usuário'},
      NULL,
      ${DEFAULT_THEME_JSON}::jsonb,
      'draft'
    )
    ON CONFLICT (user_id) DO NOTHING
    RETURNING id, handle
  `) as unknown as Array<{ id: string; handle: string }>;

  if (inserted[0]) {
    return inserted[0];
  }

  // Corrida: outro pedido criou o perfil entre o SELECT e o INSERT.
  const raced = (await db`
    SELECT id, handle FROM profiles WHERE user_id = ${session.id}::uuid LIMIT 1
  `) as unknown as Array<{ id: string; handle: string }>;

  if (!raced[0]) {
    throw new Error('profile_provisioning_failed');
  }

  return raced[0];
}
