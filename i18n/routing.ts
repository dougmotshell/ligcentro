import { defineRouting } from 'next-intl/routing';

/**
 * Configuração de roteamento de internacionalização.
 * Locales suportados: pt-BR (padrão) e en-US.
 */
export const routing = defineRouting({
  locales: ['pt-BR', 'en-US'],
  defaultLocale: 'pt-BR',
});
