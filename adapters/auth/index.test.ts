import { afterEach, describe, expect, it, vi } from 'vitest';
import { createAuthAdapter, isMockAuthActive, isMockAuthAllowed } from './index';

afterEach(() => {
  vi.unstubAllEnvs();
});

function withoutSupabase() {
  vi.stubEnv('SUPABASE_URL', '');
  vi.stubEnv('SUPABASE_ANON_KEY', '');
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '');
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', '');
}

describe('isMockAuthAllowed', () => {
  it('aceita o mock fora de produção', () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('ALLOW_MOCK_AUTH', '');

    expect(isMockAuthAllowed()).toBe(true);
  });

  it('recusa o mock em produção sem opt-in explícito', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('ALLOW_MOCK_AUTH', '');

    expect(isMockAuthAllowed()).toBe(false);
  });

  it('aceita o mock em produção só com ALLOW_MOCK_AUTH=true (docker compose de QA)', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('ALLOW_MOCK_AUTH', 'true');

    expect(isMockAuthAllowed()).toBe(true);
  });
});

describe('createAuthAdapter', () => {
  it('falha explicitamente em produção sem Supabase, em vez de cair no mock', () => {
    withoutSupabase();
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('ALLOW_MOCK_AUTH', '');

    expect(() => createAuthAdapter()).toThrowError(/auth_not_configured/);
  });

  it('entrega o adaptador mock em desenvolvimento sem Supabase', () => {
    withoutSupabase();
    vi.stubEnv('NODE_ENV', 'development');

    const adapter = createAuthAdapter();

    expect(typeof adapter.getSession).toBe('function');
    expect(isMockAuthActive()).toBe(true);
  });
});
