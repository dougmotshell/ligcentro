/**
 * A sessão mock é aceitável fora de produção; em produção exige opt-in explícito
 * (`ALLOW_MOCK_AUTH=true`, usado pelo `docker compose` de QA, que roda com
 * `NODE_ENV=production` sem Supabase).
 *
 * Módulo sem dependências de propósito: o middleware roda no Edge e precisa da
 * mesma regra que o adaptador de auth, sem arrastar o driver do Postgres junto.
 * Duas cópias da regra em lugares diferentes é como uma delas fica para trás.
 */
export function isMockAuthAllowed(): boolean {
  return process.env.NODE_ENV !== 'production' || process.env.ALLOW_MOCK_AUTH === 'true';
}
