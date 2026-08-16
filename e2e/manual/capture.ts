/**
 * Gerador do manual do usuário (TCK-0024, skill `/user-manual`).
 *
 * Autossuficiente: builda o app, sobe `next start` numa porta dedicada, captura
 * todas as telas de `screens.ts` em 2 temas × 2 idiomas × mobile/desktop, escreve
 * `docs/user-manual/` do zero e derruba o servidor. Não exige docker compose do
 * app nem `npm run dev` — só o Postgres de desenvolvimento.
 *
 * Determinismo: o manual usa o perfil semeado `demo` e a sessão mock, então
 * nenhuma execução cria dados novos nem depende do que ficou de execuções
 * anteriores. Tema e idioma são fixados antes do primeiro paint e as animações
 * são desligadas, para que rodar duas vezes não gere diff.
 *
 * Uso: npm run manual:capture [-- --skip-build]
 */
import { spawn, spawnSync } from 'node:child_process';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium, type BrowserContext, type Page } from '@playwright/test';
import { SCREENS, type Screen } from './screens';

const PORT = Number(process.env.MANUAL_PORT ?? 3312);
const BASE_URL = `http://localhost:${PORT}`;
const OUTPUT_DIR = join(process.cwd(), 'docs', 'user-manual');
const ASSETS_DIR = join(OUTPUT_DIR, 'assets');
const SKIP_BUILD = process.argv.includes('--skip-build');

const LOCALES = ['pt-BR', 'en-US'] as const;
const THEMES = ['light', 'dark'] as const;
const VIEWPORTS = {
  mobile: { width: 360, height: 780 },
  desktop: { width: 1280, height: 900 },
} as const;

type Locale = (typeof LOCALES)[number];
type Theme = (typeof THEMES)[number];
type Viewport = keyof typeof VIEWPORTS;

/** Credenciais da sessão mock — caem no perfil semeado `demo`. */
const DEMO_CREDENTIALS = { email: 'demo@ligcentro.dev', password: '123456' };

const DATABASE_URL =
  process.env.MANUAL_DATABASE_URL ??
  process.env.DATABASE_URL ??
  'postgresql://ligcentro:ligcentro@localhost:5432/ligcentro';

function assertLocalDatabase() {
  // O capturador só lê, mas roda o app inteiro com auth mock ligada. Apontar
  // isso para o banco de produção seria abrir uma sessão administrativa falsa
  // contra dados reais — barramos aqui, não na revisão de código.
  if (/supabase\.(com|co|in)/.test(DATABASE_URL)) {
    throw new Error(
      'MANUAL_DATABASE_URL/DATABASE_URL aponta para um banco gerenciado. O manual roda com auth mock e só deve falar com o Postgres de desenvolvimento.'
    );
  }
}

function build() {
  console.log('Buildando o app...');
  const result = spawnSync('npx', ['next', 'build'], { stdio: 'inherit' });
  if (result.status !== 0) throw new Error('o build falhou.');
}

/** Encerra o grupo de processos do servidor — `npx` e o `next-server` filho. */
function stopServer(server: ReturnType<typeof spawn> | null) {
  if (!server?.pid) return;

  try {
    process.kill(-server.pid, 'SIGTERM');
  } catch {
    server.kill('SIGTERM');
  }
}

async function startServer() {
  console.log(`Subindo o app na porta ${PORT}...`);

  const server = spawn('npx', ['next', 'start', '-p', String(PORT)], {
    stdio: ['ignore', 'pipe', 'pipe'],
    // Grupo próprio para que o encerramento alcance o `next-server` filho.
    // Sem isto, `kill()` mata só o `npx` e o servidor fica órfão segurando a
    // porta — a execução seguinte falha com "o servidor não respondeu".
    detached: true,
    env: {
      ...process.env,
      NODE_ENV: 'production',
      DATABASE_URL,
      NEXT_PUBLIC_APP_URL: BASE_URL,
      // Vazios de propósito: forçam o caminho de sessão mock mesmo com Supabase
      // configurado na máquina de quem roda.
      SUPABASE_URL: '',
      SUPABASE_ANON_KEY: '',
      NEXT_PUBLIC_SUPABASE_URL: '',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: '',
      ALLOW_MOCK_AUTH: 'true',
    },
  });

  const deadline = Date.now() + 120_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(BASE_URL, { cache: 'no-store' });
      if (response.status < 500) return server;
    } catch {
      // ainda subindo
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  stopServer(server);
  throw new Error('o servidor não respondeu em 120 s.');
}

function assetName(screen: Screen, theme: Theme, locale: Locale, viewport: Viewport): string {
  return `${screen.id}-${theme}-${locale}-${viewport}.png`;
}

async function prepareContext(context: BrowserContext, theme: Theme) {
  // O manual não pode gerar dados. Fotografar o perfil público disparava
  // visitas de analytics, que apareciam no painel da execução seguinte — as
  // imagens mudavam a cada rodada sem que nada no produto tivesse mudado.
  await context.route('**/api/analytics/**', (route) => route.abort());

  // O tema é lido do localStorage por um script inline antes do primeiro paint;
  // gravar aqui evita o flash de tema errado aparecer na foto.
  await context.addInitScript((value) => {
    window.localStorage.setItem('ligcentro-theme', value as string);
  }, theme);

  await context.addInitScript(() => {
    const style = document.createElement('style');
    style.textContent =
      '*, *::before, *::after { transition: none !important; animation: none !important; caret-color: transparent !important; }';
    document.documentElement.appendChild(style);
  });
}

async function signIn(context: BrowserContext) {
  const response = await context.request.post(`${BASE_URL}/api/auth/login`, {
    data: DEMO_CREDENTIALS,
  });

  if (!response.ok()) {
    throw new Error(`login da sessão mock falhou: ${response.status()}`);
  }
}

async function captureOnce(page: Page, screen: Screen, locale: Locale, target: string) {
  // `load`, não `networkidle`: o dashboard mantém requisições em voo (analytics,
  // revalidação) e a rede nunca fica ociosa por 500 ms — esperar por isso é
  // esperar por um estado que não chega. O sinal de pronto é o seletor da tela.
  await page.goto(`${BASE_URL}${screen.path.replace('{locale}', locale)}`, {
    waitUntil: 'load',
    timeout: 30_000,
  });
  await page.waitForSelector(screen.readySelector, { state: 'visible', timeout: 20_000 });

  for (const selector of screen.clicks ?? []) {
    // O painel só existe depois que o React hidrata; esperar o elemento estar
    // clicável (e não só presente) é o que separa uma foto da aba certa de um
    // timeout no fim de uma execução de 80 capturas.
    const control = page.locator(selector);
    await control.waitFor({ state: 'visible', timeout: 20_000 });
    await control.click();
    await page.waitForTimeout(150);
  }

  // Cursor fora do conteúdo antes da foto. O ponteiro fica onde foi o último
  // clique, e caindo sobre um bloco dispara `hover:opacity-90` — o manual
  // registrava um estado de hover acidental, com a transição a meio caminho, e
  // as imagens do perfil público mudavam a cada execução.
  await page.mouse.move(0, 0);

  // Fontes carregadas antes da foto: texto meio-renderizado gera diff falso.
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: target, fullPage: true });
}

/**
 * Uma segunda tentativa por tela.
 *
 * Não é para esconder defeito: a captura é longa (80 fotos num servidor recém
 * subido) e uma hidratação atrasada não deve custar a execução inteira. Se a
 * segunda também falhar, o erro sobe e o manual não é publicado pela metade.
 */
async function capture(page: Page, screen: Screen, locale: Locale, target: string) {
  try {
    await captureOnce(page, screen, locale, target);
  } catch (error) {
    // Diz *onde* o navegador parou. Sem isto, "timeout esperando o seletor" não
    // distingue tela lenta de sessão perdida (que redireciona para o login).
    const where = await page
      .evaluate(() => ({ url: location.pathname, title: document.title }))
      .catch(() => ({ url: '?', title: '?' }));

    console.warn(
      `  retentando ${screen.id} (${locale}) — estava em ${where.url} ("${where.title}"): ${(error as Error).message.split('\n')[0]}`
    );
    await captureOnce(page, screen, locale, target);
  }
}

function chapter(screen: Screen, index: number): string {
  const main = assetName(screen, 'light', 'pt-BR', 'mobile');
  const variants = [
    ['Tema escuro (celular)', assetName(screen, 'dark', 'pt-BR', 'mobile')],
    ['Tema claro (computador)', assetName(screen, 'light', 'pt-BR', 'desktop')],
    ['Tema escuro (computador)', assetName(screen, 'dark', 'pt-BR', 'desktop')],
    ['Em inglês (celular)', assetName(screen, 'light', 'en-US', 'mobile')],
  ];

  return `# ${String(index + 1).padStart(2, '0')} — ${screen.title}

${screen.purpose}

![${screen.title}](./assets/${main})

## O que dá para fazer aqui

${screen.actions.map((action) => `- ${action}`).join('\n')}

## Outras versões desta tela

${variants.map(([label, file]) => `<details><summary>${label}</summary>\n\n![${label}](./assets/${file})\n\n</details>`).join('\n\n')}

---

[← Voltar ao índice](./README.md)
`;
}

function indexPage(): string {
  return `# Manual do usuário — ligcentro

> **Gerado automaticamente** por \`npm run manual:capture\`. Não edite estes
> arquivos à mão: o texto vive em \`e2e/manual/screens.ts\` e as imagens são
> capturadas do app rodando de verdade. Editar aqui é perder o trabalho na
> próxima execução.

Este manual mostra o ligcentro como ele é hoje — cada imagem é uma foto da tela
real, não uma maquete. As telas aparecem em tema claro e escuro, em português e
inglês, no celular e no computador.

## Capítulos

${SCREENS.map((screen, index) => `${index + 1}. [${screen.title}](./${String(index + 1).padStart(2, '0')}-${screen.id}.md) — ${screen.purpose.split('.')[0]}.`).join('\n')}

## Como regenerar

\`\`\`sh
docker compose up -d db     # o Postgres de desenvolvimento
npm run manual:capture
\`\`\`

O comando builda o app, sobe um servidor próprio, fotografa todas as telas e
reescreve este diretório. Diferença esperada entre execuções: as datas do gráfico
de analytics acompanham o dia em que a captura rodou.
`;
}

/**
 * Envolvido em função porque o `tsx` transpila este arquivo como CommonJS —
 * onde `await` de topo de módulo não existe.
 */
async function main() {
  let server: ReturnType<typeof spawn> | null = null;
  let exitCode = 0;

  try {
    assertLocalDatabase();

    if (!SKIP_BUILD) build();
    server = await startServer();

    // Diretório recriado do zero: imagem órfã de uma tela removida não sobrevive.
    await rm(OUTPUT_DIR, { recursive: true, force: true });
    await mkdir(ASSETS_DIR, { recursive: true });

    const browser = await chromium.launch();
    let shots = 0;

    for (const theme of THEMES) {
      for (const locale of LOCALES) {
        for (const [viewportName, viewport] of Object.entries(VIEWPORTS)) {
          const context = await browser.newContext({
            viewport,
            colorScheme: theme,
            reducedMotion: 'reduce',
            deviceScaleFactor: 2,
            locale,
          });

          await prepareContext(context, theme);
          await signIn(context);

          const page = await context.newPage();

          for (const screen of SCREENS) {
            const target = join(
              ASSETS_DIR,
              assetName(screen, theme, locale, viewportName as Viewport)
            );
            await capture(page, screen, locale, target);
            shots += 1;
          }

          await context.close();
          console.log(`  ${theme}/${locale}/${viewportName}: ${SCREENS.length} telas`);
        }
      }
    }

    await browser.close();

    await Promise.all(
      SCREENS.map((screen, index) =>
        writeFile(
          join(OUTPUT_DIR, `${String(index + 1).padStart(2, '0')}-${screen.id}.md`),
          chapter(screen, index),
          'utf8'
        )
      )
    );
    await writeFile(join(OUTPUT_DIR, 'README.md'), indexPage(), 'utf8');

    console.log(
      `\nManual gerado: ${SCREENS.length} capítulos e ${shots} imagens em docs/user-manual/.`
    );
  } catch (error) {
    console.error('Falha ao gerar o manual:', (error as Error).message);
    exitCode = 1;
  } finally {
    stopServer(server);
  }

  process.exit(exitCode);
}

void main();
