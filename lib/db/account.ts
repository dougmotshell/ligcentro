import { withUserSession } from '@/lib/db/client';

/**
 * Apaga a conta do titular: perfil, blocos e analytics.
 *
 * Roda dentro da sessão do usuário e chama `delete_account`, que só remove o
 * perfil cujo `user_id` bate — mesmo se um chamador futuro passar outro id.
 * Devolve o handle liberado, ou `null` quando não havia perfil.
 */
export async function deleteAccountData(userId: string): Promise<string | null> {
  return withUserSession(userId, async (tx) => {
    // A função não recebe id: ela lê `app.current_user_id`, definido por
    // `withUserSession`. Assim o alcance da exclusão vem da sessão, e não de um
    // argumento que um chamador poderia trocar.
    const rows = (await tx`
      SELECT public.delete_account() AS freed_handle
    `) as unknown as Array<{ freed_handle: string | null }>;

    return rows[0]?.freed_handle ?? null;
  });
}
