/**
 * Renovação de token do Supabase Auth por REST.
 *
 * Mora fora de `adapters/auth/supabase.ts` de propósito: o middleware roda no
 * Edge e não pode importar nada que puxe o driver de Postgres. Aqui só existe
 * `fetch`.
 */

import { resolveSupabaseAuthConfig } from '@/lib/supabase/config';

export interface RefreshedTokens {
  accessToken: string;
  refreshToken: string | null;
  expiresAt: number | null;
  userId: string | null;
}

function resolveExpiresAt(body: Record<string, unknown>): number | null {
  if (typeof body.expires_at === 'number') {
    return body.expires_at;
  }

  if (typeof body.expires_in === 'number') {
    return Math.floor(Date.now() / 1000) + body.expires_in;
  }

  return null;
}

/**
 * Troca o refresh token por um par novo. Devolve `null` em qualquer falha —
 * quem chama decide entre seguir sem sessão ou mandar para o login.
 */
export async function requestRefreshedTokens(
  refreshToken: string
): Promise<RefreshedTokens | null> {
  const config = resolveSupabaseAuthConfig();

  if (!config || !refreshToken) {
    return null;
  }

  try {
    const response = await fetch(`${config.url}/auth/v1/token?grant_type=refresh_token`, {
      method: 'POST',
      headers: { apikey: config.anonKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
      cache: 'no-store',
    });

    if (!response.ok) {
      return null;
    }

    const body = (await response.json()) as Record<string, unknown>;
    const accessToken = typeof body.access_token === 'string' ? body.access_token : null;

    if (!accessToken) {
      return null;
    }

    const user = body.user as { id?: string } | undefined;

    return {
      accessToken,
      refreshToken: typeof body.refresh_token === 'string' ? body.refresh_token : null,
      expiresAt: resolveExpiresAt(body),
      userId: typeof user?.id === 'string' ? user.id : null,
    };
  } catch {
    return null;
  }
}
