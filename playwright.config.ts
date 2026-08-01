import { defineConfig, devices } from '@playwright/test';

/**
 * Configuração Playwright para os testes E2E.
 *
 * `webServer` sobe o app automaticamente: sem isso, o e2e dependia de alguém ter
 * um servidor rodando, o que é exatamente o tipo de passo manual que fazia a
 * suíte não rodar nem local nem no CI.
 *
 * O app sobe no caminho de **sessão mock** (Supabase vazio + `ALLOW_MOCK_AUTH`)
 * contra o Postgres do `docker compose` — o mesmo ambiente de validação do QA.
 */
const PORT = Number(process.env.E2E_PORT ?? 3210);
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  timeout: 60_000,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'html',
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    // Build de produção e `next start`, não `next dev`: o servidor de
    // desenvolvimento do Next 16 bloqueia recursos `/_next/` de origem diferente
    // da que o iniciou, o cliente não hidrata e nenhum teste de interação
    // funciona. Além de estável, é o ambiente que o usuário recebe.
    command: `npm run build && npx next start -p ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 240_000,
    stdout: 'pipe',
    stderr: 'pipe',
    env: {
      // Vazios de propósito: forçam o caminho mock mesmo quando existe `.env`
      // com Supabase real na máquina de quem roda.
      NEXT_PUBLIC_SUPABASE_URL: '',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: '',
      SUPABASE_URL: '',
      SUPABASE_ANON_KEY: '',
      ALLOW_MOCK_AUTH: 'true',
      DATABASE_URL:
        process.env.E2E_DATABASE_URL ?? 'postgresql://ligcentro:ligcentro@localhost:5432/ligcentro',
      NEXT_PUBLIC_APP_URL: BASE_URL,
    },
  },
});
