import type { ThemeConfig, ThemeButtonShape, ThemeFont } from '@/lib/db/types';

/**
 * Fontes oferecidas.
 *
 * São **pilhas de fontes do sistema**, não webfonts: performance do perfil
 * público é feature (regra 5), e webfont custa uma requisição bloqueante ou um
 * flash de texto. Nenhuma chamada a serviço externo de fontes também mantém a
 * privacidade do visitante.
 */
export const THEME_FONTS: Record<ThemeFont, string> = {
  sans: 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  serif: 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif',
  mono: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
  rounded:
    '"Nunito", ui-rounded, "SF Pro Rounded", "Hiragino Maru Gothic ProN", Quicksand, ui-sans-serif, system-ui, sans-serif',
};

/** Raio da borda dos botões, por formato escolhido. */
export const BUTTON_SHAPE_RADIUS: Record<ThemeButtonShape, string> = {
  square: '0px',
  rounded: '0.75rem',
  pill: '9999px',
};

export const THEME_FONT_NAMES = Object.keys(THEME_FONTS) as ThemeFont[];
export const BUTTON_SHAPE_NAMES = Object.keys(BUTTON_SHAPE_RADIUS) as ThemeButtonShape[];

export const THEME_PRESETS: Record<string, ThemeConfig> = {
  default: {
    name: 'default',
    bg: '#ffffff',
    btnBg: '#1f2937',
    btnText: '#ffffff',
    font: 'sans',
    buttonShape: 'rounded',
    useBrandColors: false,
  },
  dark: {
    name: 'dark',
    bg: '#111827',
    btnBg: '#f3f4f6',
    btnText: '#111827',
    font: 'sans',
    buttonShape: 'rounded',
    useBrandColors: false,
  },
  purple: {
    name: 'purple',
    bg: '#f5f3ff',
    btnBg: '#7c3aed',
    btnText: '#ffffff',
    font: 'rounded',
    buttonShape: 'pill',
    useBrandColors: false,
  },
  green: {
    name: 'green',
    bg: '#ecfdf5',
    btnBg: '#047857',
    btnText: '#ffffff',
    font: 'sans',
    buttonShape: 'rounded',
    useBrandColors: false,
  },
};

/** Tema inicial serializado — evita repetir o JSON literal em cada rota que cria perfil. */
export const DEFAULT_THEME_JSON = JSON.stringify(THEME_PRESETS.default);

const HEX_COLOR = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;

/**
 * Aceita apenas cor em hexadecimal.
 *
 * O valor vai para `style={{ backgroundColor }}`; sem esta checagem qualquer
 * string do usuário viraria valor de CSS. Normaliza para minúsculas para o
 * comparativo de preset ser estável.
 */
export function isValidThemeColor(value: unknown): value is string {
  return typeof value === 'string' && HEX_COLOR.test(value.trim());
}

function pickColor(value: unknown, fallback: string): string {
  return isValidThemeColor(value) ? value.trim().toLowerCase() : fallback;
}

function pickFont(value: unknown, fallback: ThemeFont): ThemeFont {
  return typeof value === 'string' && value in THEME_FONTS ? (value as ThemeFont) : fallback;
}

function pickShape(value: unknown, fallback: ThemeButtonShape): ThemeButtonShape {
  return typeof value === 'string' && value in BUTTON_SHAPE_RADIUS
    ? (value as ThemeButtonShape)
    : fallback;
}

/**
 * Saneia o tema vindo do banco ou da requisição.
 *
 * É o ponto único de compatibilidade: perfis criados antes dos campos `font`,
 * `buttonShape` e `useBrandColors` continuam renderizando, recebendo o valor do
 * preset — nenhuma migração destrutiva foi necessária.
 */
export function normalizeTheme(theme: unknown): ThemeConfig {
  if (typeof theme === 'string') {
    try {
      return normalizeTheme(JSON.parse(theme));
    } catch {
      return THEME_PRESETS.default;
    }
  }

  if (!theme || typeof theme !== 'object') {
    return THEME_PRESETS.default;
  }

  const candidate = theme as Record<string, unknown>;
  const name =
    typeof candidate.name === 'string' && candidate.name in THEME_PRESETS
      ? candidate.name
      : 'default';
  const preset = THEME_PRESETS[name];

  return {
    name,
    bg: pickColor(candidate.bg, preset.bg),
    btnBg: pickColor(candidate.btnBg, preset.btnBg),
    btnText: pickColor(candidate.btnText, preset.btnText),
    font: pickFont(candidate.font, preset.font),
    buttonShape: pickShape(candidate.buttonShape, preset.buttonShape),
    useBrandColors: candidate.useBrandColors === true,
  };
}

/** Estilo do botão derivado do tema — usado por todos os tipos de bloco. */
export function getButtonStyle(theme: ThemeConfig | undefined) {
  if (!theme) {
    return undefined;
  }

  return {
    backgroundColor: theme.btnBg,
    color: theme.btnText,
    borderRadius: BUTTON_SHAPE_RADIUS[theme.buttonShape],
  };
}
