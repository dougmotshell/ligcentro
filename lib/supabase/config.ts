/**
 * Resolução da configuração do Supabase para uso **no servidor**.
 *
 * Preferimos `SUPABASE_URL`/`SUPABASE_ANON_KEY` (sem `NEXT_PUBLIC_`): variável
 * `NEXT_PUBLIC_*` é substituída pelo valor literal no momento do build, o que
 * congelaria no bundle a escolha entre Supabase e sessão mock e impediria
 * reconfigurar o ambiente sem recompilar. Os nomes `NEXT_PUBLIC_*` seguem
 * aceitos por compatibilidade com os deploys já configurados.
 *
 * Módulo sem dependências — o middleware (Edge) o importa.
 */

export interface SupabaseAuthConfig {
  url: string;
  anonKey: string;
}

export function resolveSupabaseAuthConfig(): SupabaseAuthConfig | null {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return null;
  }

  return { url: url.replace(/\/$/, ''), anonKey };
}

export function isSupabaseAuthConfigured(): boolean {
  return resolveSupabaseAuthConfig() !== null;
}
