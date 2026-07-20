import { defineConfig, devices } from '@playwright/test';

/**
 * Configuração Playwright para testes E2E.
 * Fase 0: sem testes ainda (--pass-with-no-tests no script npm).
 * Fase 1+: testes reais aqui.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
