import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';

/**
 * Carrega as mensagens de tradução para o locale da requisição.
 * Fallback para o locale padrão (pt-BR) se inválido.
 */
export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  if (!locale || !routing.locales.includes(locale as (typeof routing.locales)[number])) {
    locale = routing.defaultLocale;
  }

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
