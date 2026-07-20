import type { ThemeConfig } from '@/lib/db/types';

export const THEME_PRESETS: Record<string, ThemeConfig> = {
  default: {
    name: 'default',
    bg: '#ffffff',
    btnBg: '#1f2937',
    btnText: '#ffffff',
  },
  dark: {
    name: 'dark',
    bg: '#111827',
    btnBg: '#f3f4f6',
    btnText: '#111827',
  },
  purple: {
    name: 'purple',
    bg: '#f5f3ff',
    btnBg: '#7c3aed',
    btnText: '#ffffff',
  },
  green: {
    name: 'green',
    bg: '#ecfdf5',
    btnBg: '#047857',
    btnText: '#ffffff',
  },
};

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
  const name = typeof candidate.name === 'string' && candidate.name in THEME_PRESETS ? candidate.name : 'default';
  const preset = THEME_PRESETS[name];

  return {
    name,
    bg: typeof candidate.bg === 'string' ? candidate.bg : preset.bg,
    btnBg: typeof candidate.btnBg === 'string' ? candidate.btnBg : preset.btnBg,
    btnText: typeof candidate.btnText === 'string' ? candidate.btnText : preset.btnText,
  };
}
