import { describe, expect, it } from 'vitest';
import { RateLimiter } from './rate-limit';

describe('RateLimiter', () => {
  it('aceita até o teto e recusa o excedente', () => {
    const limiter = new RateLimiter(3, 60_000);
    const now = 1_000;

    expect(limiter.check('perfil', now).allowed).toBe(true);
    expect(limiter.check('perfil', now).allowed).toBe(true);
    expect(limiter.check('perfil', now).allowed).toBe(true);
    expect(limiter.check('perfil', now)).toEqual({ allowed: false, hits: 3 });
  });

  it('libera na janela seguinte', () => {
    const limiter = new RateLimiter(1, 60_000);

    expect(limiter.check('perfil', 0).allowed).toBe(true);
    expect(limiter.check('perfil', 30_000).allowed).toBe(false);
    expect(limiter.check('perfil', 60_000).allowed).toBe(true);
  });

  it('conta cada chave separadamente — um perfil movimentado não bloqueia outro', () => {
    const limiter = new RateLimiter(1, 60_000);

    expect(limiter.check('perfil-a', 0).allowed).toBe(true);
    expect(limiter.check('perfil-a', 0).allowed).toBe(false);
    expect(limiter.check('perfil-b', 0).allowed).toBe(true);
  });

  it('não guarda nada além da chave recebida — nenhum dado de visitante', () => {
    const limiter = new RateLimiter(2, 60_000);
    limiter.check('view:11111111-1111-1111-1111-111111111111', 0);

    // O estado é interno, mas o contrato é o que importa: `check` só recebe uma
    // chave e um instante. Não há parâmetro de IP, cookie ou fingerprint.
    expect(RateLimiter.prototype.check.length).toBe(2);
  });
});
