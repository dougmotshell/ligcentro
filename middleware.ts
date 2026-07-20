import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

/**
 * Middleware de internacionalização.
 * Detecta o locale do visitante e redireciona para a URL com prefixo de locale.
 * Exemplo: / → /pt-BR | /en → /en-US
 */
export default createMiddleware(routing);

export const config = {
  // Intercepta todas as rotas exceto: API, arquivos estáticos (_next, assets)
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
