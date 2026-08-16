import { expect, test, type Page } from '@playwright/test';

/**
 * O alerta de verdade, ignorando o `<div role="alert">` vazio que o Next injeta
 * como anunciador de rota — sem o filtro de texto, `getByRole('alert')` casa com
 * os dois e o teste vira ruído.
 */
function alertBox(page: Page) {
  return page.getByRole('alert').filter({ hasText: /\S/ });
}

/**
 * Telas de autenticação (TCK-0020).
 *
 * O que este arquivo protege: cadastro e login oferecem os **mesmos caminhos de
 * entrada na mesma tela**. Antes, o login social só existia no login, e quem
 * chegava no cadastro tinha de navegar para outra página para usá-lo.
 */

const LOCALES = [
  {
    locale: 'pt-BR',
    signupSocial: [/Cadastrar-se com Google/, /Cadastrar-se com GitHub/],
    loginSocial: [/Continuar com Google/, /Continuar com GitHub/],
    emailLabel: 'E-mail',
    passwordLabel: 'Senha',
    handleLabel: 'Handle',
    divider: 'ou cadastre-se com',
  },
  {
    locale: 'en-US',
    signupSocial: [/Sign up with Google/, /Sign up with GitHub/],
    loginSocial: [/Continue with Google/, /Continue with GitHub/],
    emailLabel: 'Email',
    passwordLabel: 'Password',
    handleLabel: 'Handle',
    divider: 'or sign up with',
  },
] as const;

for (const config of LOCALES) {
  test.describe(`telas de auth — ${config.locale}`, () => {
    test('cadastro tem e-mail/senha e social na mesma tela, sem navegar', async ({ page }) => {
      await page.goto(`/${config.locale}/signup`);

      // Credenciais e social convivem na mesma página — nenhuma navegação entre elas.
      await expect(page.getByLabel(config.emailLabel)).toBeVisible();
      await expect(page.getByLabel(config.passwordLabel)).toBeVisible();
      await expect(page.getByLabel(config.handleLabel)).toBeVisible();
      await expect(page.getByText(config.divider)).toBeVisible();

      for (const name of config.signupSocial) {
        const button = page.getByRole('link', { name });
        await expect(button).toBeVisible();
      }

      // O destino carrega o locale e a tela de origem: o erro do provedor precisa
      // voltar para o cadastro, não jogar a pessoa no login.
      await expect(page.getByRole('link', { name: config.signupSocial[0] })).toHaveAttribute(
        'href',
        `/api/auth/oauth/google?locale=${config.locale}&from=signup`
      );
      await expect(page.getByRole('link', { name: config.signupSocial[1] })).toHaveAttribute(
        'href',
        `/api/auth/oauth/github?locale=${config.locale}&from=signup`
      );

      // A URL não mudou: tudo aconteceu na mesma tela.
      expect(new URL(page.url()).pathname).toBe(`/${config.locale}/signup`);
    });

    test('login mantém os próprios rótulos e origem', async ({ page }) => {
      await page.goto(`/${config.locale}/login`);

      for (const name of config.loginSocial) {
        await expect(page.getByRole('link', { name })).toBeVisible();
      }

      await expect(page.getByRole('link', { name: config.loginSocial[0] })).toHaveAttribute(
        'href',
        `/api/auth/oauth/google?locale=${config.locale}&from=login`
      );
    });

    test('erro de OAuth aparece na tela de cadastro', async ({ page }) => {
      await page.goto(`/${config.locale}/signup?error=oauth_profile_failed`);

      // A falha de provisionamento é distinta de "o login social falhou" — dizer
      // a causa certa é o que impede a pessoa de tentar em loop (TCK-0025).
      await expect(alertBox(page)).toBeVisible();
    });

    test('código de erro desconhecido não vira conteúdo na tela', async ({ page }) => {
      await page.goto(`/${config.locale}/signup?error=<script>alerta</script>`);

      await expect(alertBox(page)).toHaveCount(0);
    });
  });
}
