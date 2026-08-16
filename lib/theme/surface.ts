/**
 * Cores da superfície do perfil público, derivadas do tema escolhido pelo dono.
 *
 * O perfil misturava dois sistemas de tema (TCK-0021): o cartão usava
 * `bg-white/80 dark:bg-gray-900/80` — semitransparente e sensível à preferência
 * do **visitante** — sobre o fundo definido pelo **dono**. Visitante em modo
 * escuro num perfil de tema claro compunha um cinza `#414652` com texto
 * `#9ca3af` em cima: 3,72:1, reprovado em AA.
 *
 * A página é do criador: quem manda nas cores é o tema dele. Aqui as cores de
 * superfície e texto saem do fundo escolhido, com contraste garantido.
 */

export interface Surface {
  /** Fundo do cartão que contém o conteúdo. */
  background: string;
  /** Texto principal — nome do perfil, rótulos. */
  text: string;
  /** Texto secundário — bio, rodapé. Também precisa de 4,5:1. */
  mutedText: string;
}

const LIGHT_SURFACE: Surface = {
  background: '#ffffff',
  text: '#0a0a0a',
  // gray-600: 7,56:1 sobre branco. Mais claro que isto reprova AA em texto pequeno.
  mutedText: '#4b5563',
};

const DARK_SURFACE: Surface = {
  background: '#111827',
  text: '#fafafa',
  // gray-300: 11,4:1 sobre #111827.
  mutedText: '#d1d5db',
};

export function relativeLuminance(hex: string): number {
  const normalized = expandHex(hex);
  const channels = [1, 3, 5]
    .map((offset) => parseInt(normalized.slice(offset, offset + 2), 16) / 255)
    .map((channel) => (channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4));

  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

export function contrastRatio(first: string, second: string): number {
  const [lighter, darker] = [relativeLuminance(first), relativeLuminance(second)].sort(
    (a, b) => b - a
  );

  return (lighter + 0.05) / (darker + 0.05);
}

/** `#abc` → `#aabbcc`; o resto passa direto. */
function expandHex(hex: string): string {
  if (/^#[0-9a-f]{3}$/i.test(hex)) {
    return `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`;
  }

  return hex;
}

/**
 * Escolhe a superfície que combina com o fundo do tema.
 *
 * O limiar é o contraste contra branco, não um corte arbitrário de luminância:
 * fundo que já não sustenta texto branco recebe cartão claro, e vice-versa.
 */
export function resolveSurface(themeBackground: string): Surface {
  if (!/^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(themeBackground)) {
    // Cor inválida nunca deveria chegar aqui (o tema é validado ao salvar), mas
    // um perfil ilegível é pior que um perfil com o padrão claro.
    return LIGHT_SURFACE;
  }

  return relativeLuminance(themeBackground) < 0.5 ? DARK_SURFACE : LIGHT_SURFACE;
}
