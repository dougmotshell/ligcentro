// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { withUserSession } from './client';
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

describe('withUserSession', () => {
  it('recusa id de sessão malformado antes de abrir transação', async () => {
    // Não chega ao banco: o id inválido é barrado na aplicação, então a política
    // RLS nunca precisa converter uma string inválida para uuid.
    await expect(withUserSession('nao-e-uuid', async () => 'nunca')).rejects.toThrow(
      'invalid_session_user_id'
    );
  });
});
