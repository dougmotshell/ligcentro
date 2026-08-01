/**
 * Catálogo de cores oficiais de marca (Fase 1 do roadmap, inspirado no
 * LittleLink). Antes só existiam os ícones: o botão social era pintado com a cor
 * do tema, o que descaracterizava a marca.
 *
 * `text` é escolhido para manter contraste AA sobre `bg`.
 */
export interface BrandColor {
  bg: string;
  text: string;
}

export const BRAND_COLORS: Record<string, BrandColor> = {
  instagram: { bg: '#c13584', text: '#ffffff' },
  // Tom oficial escurecido 21%: o #1d9bf0 dá 3,00:1 com texto branco e
  // reprova AA para texto normal. Ver `brand-colors.test.ts`.
  twitter: { bg: '#167abd', text: '#ffffff' },
  x: { bg: '#000000', text: '#ffffff' },
  youtube: { bg: '#c4302b', text: '#ffffff' },
  github: { bg: '#24292f', text: '#ffffff' },
  tiktok: { bg: '#010101', text: '#ffffff' },
  linkedin: { bg: '#0a66c2', text: '#ffffff' },
  // Tom oficial escurecido 4% para passar de 4,23:1 para 4,56:1.
  facebook: { bg: '#1772e8', text: '#ffffff' },
};

export function getBrandColor(brand: string): BrandColor | null {
  return BRAND_COLORS[brand] ?? null;
}
