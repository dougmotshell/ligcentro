import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    // Mesmo alias do tsconfig — sem ele os módulos que importam `@/...` não
    // resolvem no vitest.
    alias: {
      '@': fileURLToPath(new URL('.', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    // `e2e/` é do Playwright: o vitest não sabe rodar aquele runner e falharia
    // só por encontrar os arquivos.
    exclude: ['node_modules/**', 'e2e/**', '.next-app/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
    },
  },
});
