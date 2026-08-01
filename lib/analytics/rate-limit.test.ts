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

  it('conta por perfil, não por visitante: chamadas distintas compartilham a janela', () => {
    const limiter = new RateLimiter(2, 60_000);
    const key = 'view:11111111-1111-1111-1111-111111111111';

    // Duas visitas de pessoas diferentes chegam com a mesma chave — a única
    // entrada que o limitador aceita é o id do perfil. Não há como distinguir
    // visitante aqui, o que é o comportamento exigido pela LGPD (regra 7).
    expect(limiter.check(key, 0).hits).toBe(1);
    expect(limiter.check(key, 10).hits).toBe(2);
    expect(limiter.check(key, 20).allowed).toBe(false);
  });
});
