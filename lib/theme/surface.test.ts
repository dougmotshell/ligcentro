import { describe, expect, it } from 'vitest';
import { contrastRatio, resolveSurface } from './surface';
import { THEME_PRESETS } from './presets';

/**
 * A superfície do perfil público precisa sustentar AA para **qualquer** fundo
 * que o dono escolha — inclusive cores fora dos presets, já que a customização
 * aceita hex livre (TCK-0014). O teste varre os presets e uma grade de cores.
 */

const AA_NORMAL_TEXT = 4.5;

function assertReadable(background: string) {
  const surface = resolveSurface(background);

  expect(
    contrastRatio(surface.text, surface.background),
    `texto principal sobre a superfície escolhida para o fundo ${background}`
  ).toBeGreaterThanOrEqual(AA_NORMAL_TEXT);

  expect(
    contrastRatio(surface.mutedText, surface.background),
    `texto secundário sobre a superfície escolhida para o fundo ${background}`
  ).toBeGreaterThanOrEqual(AA_NORMAL_TEXT);
}

describe('resolveSurface', () => {
  it.each(Object.entries(THEME_PRESETS))('preset %s mantém AA', (_name, preset) => {
    assertReadable(preset.bg);
  });

  it('mantém AA em uma grade de fundos arbitrários', () => {
    const steps = ['00', '40', '80', 'bf', 'ff'];

    for (const red of steps) {
      for (const green of steps) {
        for (const blue of steps) {
          assertReadable(`#${red}${green}${blue}`);
        }
      }
    }
  });

  it('escolhe superfície escura para fundo escuro e clara para fundo claro', () => {
    expect(resolveSurface('#000000').background).toBe('#111827');
    expect(resolveSurface('#ffffff').background).toBe('#ffffff');
  });

  it('aceita hex de três dígitos', () => {
    expect(resolveSurface('#000')).toEqual(resolveSurface('#000000'));
  });

  it('cai no claro quando a cor é inválida, em vez de produzir texto ilegível', () => {
    // O tema é validado ao salvar; isto é a rede de segurança para dado antigo.
    expect(resolveSurface('não-é-cor').background).toBe('#ffffff');
  });
});
