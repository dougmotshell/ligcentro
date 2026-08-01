// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildPublicProfileUrl, renderQrSvg } from './generate';

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('buildPublicProfileUrl', () => {
  it('usa a URL base do app', () => {
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://ligcentro.vercel.app');

    expect(buildPublicProfileUrl('douglas')).toBe('https://ligcentro.vercel.app/douglas');
  });

  it('não duplica a barra quando a base termina com uma', () => {
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://ligcentro.vercel.app/');

    expect(buildPublicProfileUrl('douglas')).toBe('https://ligcentro.vercel.app/douglas');
  });
});

describe('renderQrSvg', () => {
  it('gera SVG localmente, sem requisição externa', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');

    const svg = await renderQrSvg('https://ligcentro.vercel.app/douglas');

    expect(svg).toContain('<svg');
    expect(svg).toContain('</svg>');
    expect(fetchSpy).not.toHaveBeenCalled();

    fetchSpy.mockRestore();
  });

  it('conteúdos diferentes geram QRs diferentes', async () => {
    const [primeiro, segundo] = await Promise.all([
      renderQrSvg('https://ligcentro.vercel.app/a'),
      renderQrSvg('https://ligcentro.vercel.app/b'),
    ]);

    expect(primeiro).not.toBe(segundo);
  });
});
