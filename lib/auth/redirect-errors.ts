/**
 * Códigos de erro que chegam por redirecionamento (`?error=`) nas telas de
 * autenticação — OAuth e confirmação de e-mail.
 *
 * Compartilhado entre login e cadastro: desde que o cadastro também oferece
 * login social (TCK-0020), o erro precisa aparecer na tela onde o fluxo começou,
 * e uma lista duplicada sairia de sincronia no primeiro código novo.
 *
 * Só códigos desta lista são traduzidos e exibidos: o valor vem da URL, então
 * exibir qualquer coisa que chegue seria injeção de conteúdo na tela de login.
 */
export const REDIRECT_ERRORS = new Set([
  'oauth_state',
  'oauth_failed',
  'oauth_profile_failed',
  'confirm_invalid',
  'confirm_failed',
  'auth_not_configured',
]);

export function isRedirectError(value: unknown): value is string {
  return typeof value === 'string' && REDIRECT_ERRORS.has(value);
}
