import createNextIntlPlugin from 'next-intl/plugin';
import type { NextConfig } from 'next';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

const nextConfig: NextConfig = {
  // Isola os artefatos do Next em um diretório dedicado para evitar corrida com
  // outros processos locais no ambiente compartilhado.
  distDir: '.next-app',
  // Portabilidade: output standalone → imagem Docker mínima (sem node_modules em runtime)
  // Compatível com Vercel e docker compose sem modificação.
  output: 'standalone',
};

export default withNextIntl(nextConfig);
