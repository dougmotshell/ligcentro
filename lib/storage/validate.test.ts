import { describe, expect, it } from 'vitest';
import { MAX_AVATAR_SIZE_IN_BYTES, buildAvatarObjectPath, validateAvatarFile } from './validate';

describe('validateAvatarFile', () => {
  it('aceita os formatos de imagem previstos', () => {
    for (const type of ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/avif']) {
      expect(validateAvatarFile({ type, size: 1024 }).valid, type).toBe(true);
    }
  });

  it('normaliza a caixa do tipo declarado', () => {
    expect(validateAvatarFile({ type: 'IMAGE/PNG', size: 1024 }).extension).toBe('png');
  });

  it('recusa o que não é imagem da lista', () => {
    expect(validateAvatarFile({ type: 'application/pdf', size: 1024 })).toEqual({
      valid: false,
      error: 'invalid_file_type',
    });
    expect(validateAvatarFile({ type: 'image/svg+xml', size: 1024 }).error).toBe(
      'invalid_file_type'
    );
    expect(validateAvatarFile({ type: '', size: 1024 }).error).toBe('invalid_file_type');
  });

  it('recusa arquivo vazio', () => {
    expect(validateAvatarFile({ type: 'image/png', size: 0 }).error).toBe('empty_file');
  });

  it('recusa acima do limite e aceita no limite', () => {
    expect(
      validateAvatarFile({ type: 'image/png', size: MAX_AVATAR_SIZE_IN_BYTES + 1 }).error
    ).toBe('file_too_large');
    expect(validateAvatarFile({ type: 'image/png', size: MAX_AVATAR_SIZE_IN_BYTES }).valid).toBe(
      true
    );
  });
});

describe('buildAvatarObjectPath', () => {
  it('monta o caminho a partir do dono, da extensão e de um sufixo único', () => {
    expect(buildAvatarObjectPath('11111111-1111-1111-1111-111111111111', 'png', 'abc')).toBe(
      '11111111-1111-1111-1111-111111111111/avatar-abc.png'
    );
  });

  it('não usa o nome enviado pelo usuário — nada de travessia de diretório', () => {
    // A extensão vem do tipo declarado; o nome original nem entra na função.
    const path = buildAvatarObjectPath('11111111-1111-1111-1111-111111111111', 'png', 'x');

    expect(path).not.toContain('..');
    expect(path.split('/')).toHaveLength(2);
  });
});
