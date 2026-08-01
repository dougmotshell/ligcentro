import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  SESSION_COOKIE_NAMES,
  clearedCookieOptions,
  isSecureRuntime,
  parseExpiresAt,
  sessionCookieOptions,
  shouldRefresh,
} from './cookies';

function setNodeEnv(value: string) {
  vi.stubEnv('NODE_ENV', value);
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('sessionCookieOptions', () => {
  it('marca o cookie como httpOnly e lax sempre', () => {
    const options = sessionCookieOptions();

    expect(options.httpOnly).toBe(true);
    expect(options.sameSite).toBe('lax');
    expect(options.path).toBe('/');
  });

  it('exige secure em produção', () => {
    setNodeEnv('production');

    expect(isSecureRuntime()).toBe(true);
    expect(sessionCookieOptions().secure).toBe(true);
  });

  it('dispensa secure em desenvolvimento (http://localhost)', () => {
    setNodeEnv('development');

    expect(isSecureRuntime()).toBe(false);
    expect(sessionCookieOptions().secure).toBe(false);
  });

  it('expira o cookie com maxAge zero', () => {
    expect(clearedCookieOptions().maxAge).toBe(0);
  });
});

describe('shouldRefresh', () => {
  const now = 1_000_000;

  it('não renova quando não há expiração conhecida', () => {
    expect(shouldRefresh(null, now)).toBe(false);
  });

  it('não renova enquanto o token está longe de expirar', () => {
    expect(shouldRefresh(now + 600, now)).toBe(false);
  });

  it('renova dentro da margem de segurança', () => {
    expect(shouldRefresh(now + 30, now)).toBe(true);
  });

  it('renova quando o token já expirou', () => {
    expect(shouldRefresh(now - 10, now)).toBe(true);
  });
});

describe('parseExpiresAt', () => {
  it('devolve null para ausente, vazio ou não numérico', () => {
    expect(parseExpiresAt(undefined)).toBeNull();
    expect(parseExpiresAt('')).toBeNull();
    expect(parseExpiresAt('abc')).toBeNull();
    expect(parseExpiresAt('-5')).toBeNull();
  });

  it('converte epoch válido', () => {
    expect(parseExpiresAt('1786195321')).toBe(1786195321);
  });
});

describe('SESSION_COOKIE_NAMES', () => {
  it('cobre as duas formas de sessão, para o logout não deixar resíduo', () => {
    expect([...SESSION_COOKIE_NAMES]).toEqual([
      'sb-access-token',
      'sb-refresh-token',
      'sb-expires-at',
      'mock-auth',
    ]);
  });
});
