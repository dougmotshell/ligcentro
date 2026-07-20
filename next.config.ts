import createNextIntlPlugin from 'next-intl/plugin';
import type { NextConfig } from 'next';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

const nextConfig: NextConfig = {
  // Portabilidade: output standalone → imagem Docker mínima (sem node_modules em runtime)
  // Compatível com Vercel e docker compose sem modificação.
  output: 'standalone',
};

export default withNextIntl(nextConfig);
