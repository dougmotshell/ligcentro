import { expect, test } from '@playwright/test';

/**
 * Fluxo crítico do MVP, o critério de pronto da Fase 2 do roadmap:
 * cadastro → editar perfil → publicar → ver perfil público → registrar clique.
 *
 * Roda no caminho de sessão mock (sem Supabase) contra o Postgres do
 * `docker compose` — é o ambiente que o QA usa e o que o CI sobe.
 */

/** Handle único por execução, para os testes não colidirem entre si. */
function uniqueHandle(): string {
  return `e2e-${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-4)}`;
}

test.describe('fluxo crítico', () => {
  test('cadastro → editar → publicar → ver público → clicar', async ({ page, request }) => {
    const handle = uniqueHandle();

    // ─── Cadastro ────────────────────────────────────────────────────────────
    await page.goto('/pt-BR/signup');
    await page.getByLabel('E-mail').fill(`${handle}@exemplo.dev`);
    await page.getByLabel('Senha').fill('senha-de-teste');
    await page.getByLabel('Handle').fill(handle);
    await expect(page.getByText('Handle disponível.')).toBeVisible();
    await page.getByRole('button', { name: 'Criar conta' }).click();

    // O cadastro leva ao onboarding; daí seguimos direto para o editor.
    await page.waitForURL(/\/(onboarding|dashboard)/);
    await page.goto('/pt-BR/dashboard');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    // ─── Estado inicial: rascunho, invisível ao público ──────────────────────
    await expect(page.getByText('Rascunho')).toBeVisible();
    const draftResponse = await request.get(`/pt-BR/${handle}`);
    expect(draftResponse.status()).toBe(404);

    // ─── Editar perfil ───────────────────────────────────────────────────────
    await page.getByRole('button', { name: 'Perfil', exact: true }).click();
    const displayName = 'Perfil de teste e2e';
    await page.getByLabel('Nome exibido').fill(displayName);
    await page.getByLabel('Bio').fill('Criado pelo teste de ponta a ponta.');
    await page.getByRole('button', { name: 'Salvar perfil' }).click();

    // ─── Criar um bloco de link ──────────────────────────────────────────────
    await page.getByRole('button', { name: 'Blocos', exact: true }).click();
    await page.getByRole('button', { name: 'Novo bloco' }).click();
    await page.getByLabel('Rótulo').fill('Meu site de teste');
    await page.getByLabel('URL').fill('https://exemplo.dev/e2e');
    await page.getByRole('button', { name: 'Criar bloco' }).click();
    await expect(page.getByText('Meu site de teste')).toBeVisible();

    // ─── Publicar ────────────────────────────────────────────────────────────
    await page.getByRole('button', { name: 'Publicar página' }).click();
    // O botão virar "Despublicar" é o sinal inequívoco de que o estado mudou —
    // procurar o texto "Publicada" casa também com outros parágrafos da tela.
    await expect(page.getByRole('button', { name: 'Despublicar' })).toBeVisible();

    // ─── Ver o perfil público ────────────────────────────────────────────────
    await page.goto(`/pt-BR/${handle}`);
    await expect(page.getByRole('heading', { name: displayName })).toBeVisible();
    const blockLink = page.getByRole('link', { name: 'Meu site de teste' });
    await expect(blockLink).toBeVisible();
    await expect(blockLink).toHaveAttribute('href', /exemplo\.dev\/e2e/);

    // ─── Registrar clique e conferir no painel ───────────────────────────────
    // O clique abre outra aba; o que importa é o evento de analytics sair.
    const clickRequest = page.waitForRequest(
      (candidate) =>
        candidate.url().includes('/api/analytics/click') && candidate.method() === 'POST'
    );
    await blockLink.click({ modifiers: ['Control'] });
    await clickRequest;

    await page.goto('/pt-BR/dashboard/analytics');
    await expect(page.getByRole('heading', { name: /Visitas e cliques/ })).toBeVisible();
    await expect(page.getByText('Meu site de teste')).toBeVisible();
  });

  test('QR code da página aparece no dashboard e pode ser baixado', async ({ page }) => {
    const handle = uniqueHandle();

    await page.goto('/pt-BR/signup');
    await page.getByLabel('E-mail').fill(`${handle}@exemplo.dev`);
    await page.getByLabel('Senha').fill('senha-de-teste');
    await page.getByLabel('Handle').fill(handle);
    await page.getByRole('button', { name: 'Criar conta' }).click();
    await page.waitForURL(/\/(onboarding|dashboard)/);

    await page.goto('/pt-BR/dashboard');
    await expect(page.getByRole('img', { name: new RegExp(handle) })).toBeVisible();

    const download = page.getByRole('link', { name: 'Baixar QR code' });
    await expect(download).toHaveAttribute('download', `ligcentro-${handle}.svg`);
    await expect(download).toHaveAttribute('href', /^data:image\/svg\+xml/);
  });

  test('perfil inexistente responde 404 traduzido', async ({ page }) => {
    const response = await page.goto('/pt-BR/nao-existe-mesmo-2026');

    expect(response?.status()).toBe(404);
    await expect(page.getByText(/não encontrado|not found/i).first()).toBeVisible();
  });
});
