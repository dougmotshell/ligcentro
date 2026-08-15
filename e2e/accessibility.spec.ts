import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

/**
 * Auditoria de acessibilidade AA (TCK-0021).
 *
 * O roadmap prometia "acessibilidade AA nos dois temas" com uma única evidência:
 * o contraste do catálogo de cores de marca. Auditoria feita à mão uma vez não
 * sobrevive ao commit seguinte — aqui ela vira teste.
 *
 * Cobertura: todas as telas principais, nos dois temas. O tema é aplicado por
 * classe `dark` no `<html>`, escrita por um script inline que lê `localStorage`
 * ou `prefers-color-scheme` — daí a emulação de `colorScheme` bastar.
 */

/** Regras WCAG 2.0/2.1 níveis A e AA — o que o roadmap promete. */
const WCAG_AA = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

async function expectNoViolations(page: Page, context: string) {
  // Congela transições antes de medir. Sem isto, o axe amostra a cor no meio do
  // fade da aba recém-clicada e acusa contraste de 1,63:1 entre dois estados
  // intermediários que ninguém lê — o que importa é a cor em repouso.
  await page.addStyleTag({
    content: '*, *::before, *::after { transition: none !important; animation: none !important; }',
  });
  await page.waitForTimeout(50);

  const results = await new AxeBuilder({ page }).withTags(WCAG_AA).analyze();

  const summary = results.violations.map((violation) => ({
    id: violation.id,
    impact: violation.impact,
    help: violation.help,
    // O seletor sozinho ("button") não diz qual botão nem quais cores falharam;
    // `failureSummary` e o html do nó são o que permite corrigir sem adivinhar.
    nodes: violation.nodes.map((node) => ({
      target: node.target.join(' '),
      html: node.html.slice(0, 160),
      reason: (node.failureSummary ?? '').replace(/\s+/g, ' ').slice(0, 240),
    })),
  }));

  // A mensagem carrega o que falhou e onde: uma contagem sozinha obrigaria quem
  // for corrigir a rodar tudo de novo só para descobrir a regra.
  expect(summary, `violações A/AA em ${context}: ${JSON.stringify(summary, null, 2)}`).toEqual([]);
}

function uniqueHandle(): string {
  return `a11y${Math.random().toString(36).slice(2, 7)}${Date.now().toString(36).slice(-4)}`;
}

/** Cria uma conta pelo caminho de sessão mock e devolve o handle. */
async function signUp(page: Page): Promise<string> {
  const handle = uniqueHandle();

  await page.goto('/pt-BR/signup');
  await page.getByLabel('E-mail').fill(`${handle}@exemplo.dev`);
  await page.getByLabel('Senha').fill('senha-de-teste');
  await page.getByLabel('Handle').fill(handle);
  await page.getByRole('button', { name: 'Criar conta' }).click();
  await page.waitForURL(/\/(onboarding|dashboard)/);

  return handle;
}

for (const colorScheme of ['light', 'dark'] as const) {
  test.describe(`acessibilidade AA — tema ${colorScheme}`, () => {
    test.use({ colorScheme });

    test('telas públicas não têm violação A/AA', async ({ page }) => {
      await page.goto('/pt-BR');
      await expectNoViolations(page, `landing (${colorScheme})`);

      await page.goto('/pt-BR/login');
      await expectNoViolations(page, `login (${colorScheme})`);

      await page.goto('/pt-BR/signup');
      await expectNoViolations(page, `cadastro (${colorScheme})`);

      await page.goto('/en-US/signup');
      await expectNoViolations(page, `cadastro en-US (${colorScheme})`);
    });

    test('telas autenticadas e perfil público não têm violação A/AA', async ({ page }) => {
      const handle = await signUp(page);

      await page.goto('/pt-BR/onboarding?step=1');
      await expectNoViolations(page, `onboarding (${colorScheme})`);

      await page.goto('/pt-BR/dashboard');
      await expectNoViolations(page, `dashboard/perfil (${colorScheme})`);

      for (const tab of ['Blocos', 'Temas', 'Meus dados']) {
        await page.getByRole('button', { name: tab, exact: true }).click();
        await expectNoViolations(page, `dashboard/${tab} (${colorScheme})`);
      }

      await page.goto('/pt-BR/dashboard/analytics');
      await expectNoViolations(page, `analytics (${colorScheme})`);

      // O perfil público precisa estar publicado para existir de fato.
      await page.goto('/pt-BR/dashboard');
      await page.getByRole('button', { name: 'Publicar página' }).click();
      await expect(page.getByRole('button', { name: 'Despublicar' })).toBeVisible();

      await page.goto(`/pt-BR/${handle}`);
      await expectNoViolations(page, `perfil público (${colorScheme})`);
    });
  });
}

test.describe('navegação por teclado', () => {
  test('o cadastro inteiro é operável por teclado, com foco visível', async ({ page }) => {
    await page.goto('/pt-BR/signup');

    // Percorre os controles na ordem do documento e confirma que o foco não some
    // nem fica preso — armadilha de foco é justamente o que passa despercebido
    // em teste visual.
    const reachable: string[] = [];

    for (let step = 0; step < 12; step += 1) {
      await page.keyboard.press('Tab');
      const focused = await page.evaluate(() => {
        const element = document.activeElement;
        if (!element || element === document.body) return null;
        const styles = getComputedStyle(element);
        return {
          tag: element.tagName.toLowerCase(),
          type: element.getAttribute('type'),
          text: (element.textContent ?? '').trim().slice(0, 30),
          // O anel de foco do projeto é `focus-visible:ring-*`, que o Tailwind
          // aplica via box-shadow.
          hasRing: styles.boxShadow !== 'none' || styles.outlineStyle !== 'none',
        };
      });

      if (focused) {
        reachable.push(`${focused.tag}${focused.type ? `[${focused.type}]` : ''} ${focused.text}`);
        expect(focused.hasRing, `sem indicação de foco em: ${JSON.stringify(focused)}`).toBe(true);
      }
    }

    // Os três campos, o botão de envio e os dois botões sociais têm de estar no
    // caminho do teclado.
    const joined = reachable.join(' | ');
    expect(joined).toContain('input[email]');
    expect(joined).toContain('input[password]');
    expect(joined).toContain('button');
    expect(joined).toMatch(/Google/);
    expect(joined).toMatch(/GitHub/);
  });
});
