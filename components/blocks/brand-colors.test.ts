import { describe, expect, it } from 'vitest';
import { BRAND_COLORS, getBrandColor } from './brand-colors';

/** Razão de contraste WCAG entre duas cores hexadecimais. */
function contrastRatio(first: string, second: string): number {
  const luminance = (hex: string) => {
    const channels = [1, 3, 5].map(
      (offset) => Number.parseInt(hex.slice(offset, offset + 2), 16) / 255
    );
    const [r, g, b] = channels.map((channel) =>
      channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
    );

    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };

  const [lighter, darker] = [luminance(first), luminance(second)].sort((a, b) => b - a);

  return (lighter + 0.05) / (darker + 0.05);
}

describe('catálogo de cores de marca', () => {
  it('todo par cor/texto passa em AA para texto normal (4,5:1)', () => {
    // O rótulo do bloco é texto de tamanho normal, então 3:1 (texto grande) não
    // basta. Os tons do Twitter e do Facebook foram escurecidos por isso.
    for (const [brand, color] of Object.entries(BRAND_COLORS)) {
      expect(
        contrastRatio(color.bg, color.text),
        `${brand} ${color.bg}/${color.text}`
      ).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('cobre as redes do catálogo de ícones', () => {
    for (const brand of [
      'instagram',
      'twitter',
      'x',
      'youtube',
      'github',
      'tiktok',
      'linkedin',
      'facebook',
    ]) {
      expect(getBrandColor(brand), brand).not.toBeNull();
    }
  });

  it('devolve null para marca desconhecida, em vez de cor errada', () => {
    expect(getBrandColor('orkut')).toBeNull();
  });
});
