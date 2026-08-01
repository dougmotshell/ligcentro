import { describe, expect, it } from 'vitest';
import {
  BUTTON_SHAPE_RADIUS,
  THEME_FONTS,
  THEME_PRESETS,
  getButtonStyle,
  isValidThemeColor,
  normalizeTheme,
} from './presets';

describe('isValidThemeColor', () => {
  it('aceita hexadecimal de 3 e de 6 dígitos', () => {
    expect(isValidThemeColor('#fff')).toBe(true);
    expect(isValidThemeColor('#FFFFFF')).toBe(true);
    expect(isValidThemeColor('  #1f2937  ')).toBe(true);
  });

  it('recusa qualquer coisa que não seja hexadecimal', () => {
    // Sem esta barreira o valor iria direto para uma propriedade de CSS.
    expect(isValidThemeColor('red')).toBe(false);
    expect(isValidThemeColor('rgb(0,0,0)')).toBe(false);
    expect(isValidThemeColor('#fff; background-image: url(https://x.dev/p.png)')).toBe(false);
    expect(isValidThemeColor('url(javascript:alert(1))')).toBe(false);
    expect(isValidThemeColor('')).toBe(false);
    expect(isValidThemeColor(null)).toBe(false);
  });
});

describe('normalizeTheme', () => {
  it('completa tema antigo, sem os campos novos, com os valores do preset', () => {
    // Compatibilidade: perfis criados antes de font/buttonShape/useBrandColors.
    const antigo = { name: 'purple', bg: '#f5f3ff', btnBg: '#7c3aed', btnText: '#ffffff' };

    expect(normalizeTheme(antigo)).toEqual(THEME_PRESETS.purple);
  });

  it('aceita string JSON (como vem do jsonb)', () => {
    expect(normalizeTheme(JSON.stringify(THEME_PRESETS.dark))).toEqual(THEME_PRESETS.dark);
  });

  it('cai no tema padrão para entrada inválida', () => {
    expect(normalizeTheme(null)).toEqual(THEME_PRESETS.default);
    expect(normalizeTheme('não é json')).toEqual(THEME_PRESETS.default);
    expect(normalizeTheme(42)).toEqual(THEME_PRESETS.default);
  });

  it('descarta cor inválida e mantém a do preset', () => {
    const resultado = normalizeTheme({ name: 'default', bg: 'red; content: "x"' });

    expect(resultado.bg).toBe(THEME_PRESETS.default.bg);
  });

  it('descarta fonte e formato desconhecidos', () => {
    const resultado = normalizeTheme({
      name: 'default',
      font: 'comic-sans',
      buttonShape: 'triangulo',
    });

    expect(resultado.font).toBe('sans');
    expect(resultado.buttonShape).toBe('rounded');
  });

  it('preserva as escolhas válidas do usuário', () => {
    const resultado = normalizeTheme({
      name: 'default',
      bg: '#ABCDEF',
      btnBg: '#123',
      btnText: '#000000',
      font: 'serif',
      buttonShape: 'pill',
      useBrandColors: true,
    });

    expect(resultado).toEqual({
      name: 'default',
      bg: '#abcdef',
      btnBg: '#123',
      btnText: '#000000',
      font: 'serif',
      buttonShape: 'pill',
      useBrandColors: true,
    });
  });

  it('trata useBrandColors como booleano estrito', () => {
    expect(normalizeTheme({ useBrandColors: 'sim' }).useBrandColors).toBe(false);
    expect(normalizeTheme({ useBrandColors: 1 }).useBrandColors).toBe(false);
    expect(normalizeTheme({ useBrandColors: true }).useBrandColors).toBe(true);
  });
});

describe('getButtonStyle', () => {
  it('leva cor e raio do formato escolhido', () => {
    expect(getButtonStyle(THEME_PRESETS.purple)).toEqual({
      backgroundColor: '#7c3aed',
      color: '#ffffff',
      borderRadius: BUTTON_SHAPE_RADIUS.pill,
    });
  });

  it('devolve undefined sem tema', () => {
    expect(getButtonStyle(undefined)).toBeUndefined();
  });
});

describe('fontes', () => {
  it('todas as fontes são pilhas do sistema — nenhuma webfont externa', () => {
    for (const stack of Object.values(THEME_FONTS)) {
      expect(stack).not.toMatch(/https?:|fonts\.googleapis|@import|url\(/);
      expect(stack.split(',').length).toBeGreaterThan(1);
    }
  });
});
