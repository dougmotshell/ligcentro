import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Contraste AA dos design tokens (TCK-0021).
 *
 * A auditoria com axe encontrou a primária `#6366f1` reprovando AA por uma casa
 * decimal (4,46:1 contra 4,5:1 exigido) em **todo** botão e link primário, e o
 * branco sobre a primária do tema escuro em 2,98:1. Um token errado vira dezenas
 * de violações, então o lugar de travar isso é no token.
 *
 * Este teste lê o CSS de verdade — não uma cópia das cores — para não passar a
 * verde enquanto o produto regride.
 */

const CSS = readFileSync(join(process.cwd(), 'app', 'globals.css'), 'utf8');

/** Extrai o bloco de um seletor e devolve as variáveis de cor declaradas nele. */
function tokensOf(selector: string): Record<string, string> {
  const block = new RegExp(`${selector}\\s*\\{([^}]*)\\}`).exec(CSS);
  expect(block, `bloco ${selector} não encontrado em globals.css`).not.toBeNull();

  const tokens: Record<string, string> = {};
  for (const [, name, value] of block![1].matchAll(/--(color-[a-z-]+):\s*(#[0-9a-fA-F]{6});/g)) {
    tokens[name] = value.toLowerCase();
  }
  return tokens;
}

function relativeLuminance(hex: string): number {
  const channels = [1, 3, 5]
    .map((offset) => parseInt(hex.slice(offset, offset + 2), 16) / 255)
    .map((channel) => (channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4));

  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrastRatio(first: string, second: string): number {
  const [lighter, darker] = [relativeLuminance(first), relativeLuminance(second)].sort(
    (a, b) => b - a
  );

  return (lighter + 0.05) / (darker + 0.05);
}

const THEMES = [
  { name: 'claro', selector: ':root' },
  { name: 'escuro', selector: '\\.dark' },
] as const;

describe.each(THEMES)('tokens de cor — tema $name', ({ selector }) => {
  const tokens = tokensOf(selector);

  /** Pares texto/fundo que precisam de 4,5:1 (WCAG 1.4.3, texto normal). */
  const TEXT_PAIRS: Array<[string, string, string]> = [
    ['color-foreground', 'color-background', 'texto do corpo sobre o fundo'],
    ['color-muted-foreground', 'color-background', 'texto secundário sobre o fundo'],
    ['color-primary', 'color-background', 'link/rótulo primário sobre o fundo'],
    ['color-primary-foreground', 'color-primary', 'texto dentro do botão primário'],
    ['color-secondary-foreground', 'color-secondary', 'texto sobre a superfície secundária'],
  ];

  it.each(TEXT_PAIRS)('%s sobre %s atinge 4,5:1 (%s)', (foreground, background) => {
    const ratio = contrastRatio(tokens[foreground], tokens[background]);

    expect(
      ratio,
      `${foreground} (${tokens[foreground]}) sobre ${background} (${tokens[background]}) = ${ratio.toFixed(2)}:1`
    ).toBeGreaterThanOrEqual(4.5);
  });

  it('o anel de foco atinge 3:1 contra o fundo (WCAG 1.4.11)', () => {
    const ratio = contrastRatio(tokens['color-ring'], tokens['color-background']);

    expect(ratio, `anel ${tokens['color-ring']} = ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(3);
  });
});
