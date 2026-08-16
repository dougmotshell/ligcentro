import { expect, test } from '@playwright/test';

/**
 * Cabeçalhos de segurança (auditoria TCK-0023).
 *
 * A configuração vive em `next.config.ts` e é o tipo de coisa que some numa
 * refatoração sem ninguém notar — o app continua funcionando perfeitamente sem
 * ela. Por isso o contrato fica aqui, exercitado contra o servidor de verdade.
 */

const PAGES = ['/pt-BR', '/pt-BR/login', '/pt-BR/signup', '/pt-BR/demo'];

for (const path of PAGES) {
  test(`cabeçalhos de segurança presentes em ${path}`, async ({ request }) => {
    const response = await request.get(path);
    const headers = response.headers();

    // Clickjacking: o dashboard tem exclusão de conta atrás de um clique.
    expect(headers['x-frame-options']).toBe('DENY');
    expect(headers['content-security-policy']).toContain("frame-ancestors 'none'");

    expect(headers['x-content-type-options']).toBe('nosniff');
    expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
    expect(headers['strict-transport-security']).toContain('max-age=');
    expect(headers['permissions-policy']).toContain('geolocation=()');

    // Diretivas que barram exfiltração e injeção de destino mesmo com XSS.
    const csp = headers['content-security-policy'];
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("base-uri 'self'");
    expect(csp).toContain("form-action 'self'");
  });
}
