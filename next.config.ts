import createNextIntlPlugin from 'next-intl/plugin';
import type { NextConfig } from 'next';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

/**
 * Cabeçalhos de segurança (auditoria TCK-0023).
 *
 * Até aqui a única proteção era o HSTS que a Vercel injeta sozinha. Sem
 * `frame-ancestors`, qualquer site podia embutir o dashboard num iframe e
 * induzir cliques — inclusive no botão de excluir a conta.
 *
 * Limitação assumida: `script-src` precisa de `'unsafe-inline'` porque o app
 * aplica o tema por script inline antes da primeira pintura (evita flash de
 * tema errado) e o Next injeta o bootstrap de hidratação inline. Trocar por
 * nonce exige gerar o valor no middleware e propagá-lo — vale a pena, mas é
 * mudança de arquitetura e fica registrada como recomendação, não feita às
 * pressas junto de uma auditoria. As demais diretivas seguem restritas.
 */
const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  // Avatar pode apontar para qualquer host https (ver `getSafeImageUrl`).
  "img-src 'self' https: data: blob:",
  "font-src 'self' data:",
  // O cliente fala com a própria origem; o Supabase é chamado do servidor.
  "connect-src 'self'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  'upgrade-insecure-requests',
].join('; ');

const SECURITY_HEADERS = [
  { key: 'Content-Security-Policy', value: CONTENT_SECURITY_POLICY },
  // Redundante com `frame-ancestors` para navegadores antigos, e barato.
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // O perfil público leva o visitante a sites de terceiros: sem isto, o handle
  // visitado viaja no `Referer` para cada destino.
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
];

const nextConfig: NextConfig = {
  // Isola os artefatos do Next em um diretório dedicado para evitar corrida com
  // outros processos locais no ambiente compartilhado.
  distDir: '.next-app',
  // Portabilidade: output standalone → imagem Docker mínima (sem node_modules em runtime)
  // Compatível com Vercel e docker compose sem modificação.
  output: 'standalone',
  async headers() {
    return [{ source: '/:path*', headers: SECURITY_HEADERS }];
  },
};

export default withNextIntl(nextConfig);
