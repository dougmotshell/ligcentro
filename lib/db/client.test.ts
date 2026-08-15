// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { getDb, withUserSession } from './client';
import { isUuid } from '@/lib/uuid';

describe('isUuid', () => {
  it('aceita uuid v4 em qualquer caixa', () => {
    expect(isUuid('00000000-0000-0000-0000-000000000001')).toBe(true);
    expect(isUuid('A4450FD8-4E29-4C86-B36A-52341434CCDE')).toBe(true);
  });

  it('recusa o que não é uuid', () => {
    expect(isUuid('')).toBe(false);
    expect(isUuid('abc')).toBe(false);
    expect(isUuid("' OR 1=1 --")).toBe(false);
    expect(isUuid('00000000-0000-0000-0000-00000000000')).toBe(false);
    expect(isUuid(null)).toBe(false);
    expect(isUuid(42)).toBe(false);
  });
});

describe('getDb', () => {
  it('reaproveita o mesmo pool entre chamadas, inclusive em produção', () => {
    // Regressão do vazamento de conexões (TCK-0024): o cache do pool valia só
    // fora de produção, então cada consulta em produção abria até 10 conexões
    // novas que nunca fechavam — o banco chegava a "too many clients".
    const previousEnv = process.env.NODE_ENV;
    const previousUrl = process.env.DATABASE_URL;

    try {
      process.env.DATABASE_URL =
        previousUrl ?? 'postgresql://ligcentro:ligcentro@localhost:5432/ligcentro';
      // `NODE_ENV` é somente-leitura no tipo do Node, mas gravável em runtime —
      // é exatamente a condição que precisamos exercitar.
      (process.env as Record<string, string | undefined>).NODE_ENV = 'production';

      expect(getDb()).toBe(getDb());
    } finally {
      (process.env as Record<string, string | undefined>).NODE_ENV = previousEnv;
      process.env.DATABASE_URL = previousUrl;
    }
  });
});

describe('withUserSession', () => {
  it('recusa id de sessão malformado antes de abrir transação', async () => {
    // Não chega ao banco: o id inválido é barrado na aplicação, então a política
    // RLS nunca precisa converter uma string inválida para uuid.
    await expect(withUserSession('nao-e-uuid', async () => 'nunca')).rejects.toThrow(
      'invalid_session_user_id'
    );
  });
});
