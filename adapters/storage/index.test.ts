// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createStorageAdapter } from './index';
import { saveFileLocally } from './local';
import { extractObjectPath, saveFileToSupabase } from './supabase';

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('createStorageAdapter', () => {
  it('usa o storage local quando não há Supabase', () => {
    vi.stubEnv('SUPABASE_URL', '');
    vi.stubEnv('SUPABASE_ANON_KEY', '');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', '');

    expect(createStorageAdapter().saveFile).toBe(saveFileLocally);
  });

  it('usa o Supabase Storage quando configurado — antes isto lançava sempre', () => {
    vi.stubEnv('SUPABASE_URL', 'https://exemplo.supabase.co');
    vi.stubEnv('SUPABASE_ANON_KEY', 'chave-anon');

    expect(createStorageAdapter().saveFile).toBe(saveFileToSupabase);
  });
});

describe('saveFileToSupabase', () => {
  function fakeFile(type = 'image/png', size = 10): File {
    return {
      type,
      size,
      arrayBuffer: async () => new ArrayBuffer(size),
    } as unknown as File;
  }

  it('recusa o arquivo antes de qualquer chamada de rede', async () => {
    vi.stubEnv('SUPABASE_URL', 'https://exemplo.supabase.co');
    vi.stubEnv('SUPABASE_ANON_KEY', 'chave-anon');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'chave-servico');
    const fetchSpy = vi.spyOn(globalThis, 'fetch');

    await expect(
      saveFileToSupabase('11111111-1111-1111-1111-111111111111', fakeFile('text/plain'))
    ).rejects.toThrow('invalid_file_type');
    expect(fetchSpy).not.toHaveBeenCalled();

    fetchSpy.mockRestore();
  });

  it('avisa quando falta a chave de serviço, em vez de tentar gravar', async () => {
    vi.stubEnv('SUPABASE_URL', 'https://exemplo.supabase.co');
    vi.stubEnv('SUPABASE_ANON_KEY', 'chave-anon');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', '');

    await expect(
      saveFileToSupabase('11111111-1111-1111-1111-111111111111', fakeFile())
    ).rejects.toThrow('storage_service_key_missing');
  });

  it('devolve a URL pública do objeto e não vaza a chave na URL', async () => {
    vi.stubEnv('SUPABASE_URL', 'https://exemplo.supabase.co');
    vi.stubEnv('SUPABASE_ANON_KEY', 'chave-anon');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'chave-servico');

    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response('{}', { status: 200 }));

    const { url } = await saveFileToSupabase('11111111-1111-1111-1111-111111111111', fakeFile());

    expect(url).toMatch(
      /^https:\/\/exemplo\.supabase\.co\/storage\/v1\/object\/public\/avatars\/11111111-1111-1111-1111-111111111111\/avatar-[0-9a-f-]+\.png$/
    );
    expect(url).not.toContain('chave-servico');

    const [, init] = fetchSpy.mock.calls[0];
    expect((init?.headers as Record<string, string>).Authorization).toBe('Bearer chave-servico');

    fetchSpy.mockRestore();
  });

  it('transforma falha do provedor em erro nomeado', async () => {
    vi.stubEnv('SUPABASE_URL', 'https://exemplo.supabase.co');
    vi.stubEnv('SUPABASE_ANON_KEY', 'chave-anon');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'chave-servico');

    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response('bucket not found', { status: 404 }));

    await expect(
      saveFileToSupabase('11111111-1111-1111-1111-111111111111', fakeFile())
    ).rejects.toThrow(/^storage_upload_failed/);

    fetchSpy.mockRestore();
  });
});

describe('extractObjectPath', () => {
  it('reconhece a URL pública do próprio bucket', () => {
    expect(
      extractObjectPath(
        'https://exemplo.supabase.co/storage/v1/object/public/avatars/11111111-1111-1111-1111-111111111111/avatar-22222222-2222-2222-2222-222222222222.png'
      )
    ).toBe('11111111-1111-1111-1111-111111111111/avatar-22222222-2222-2222-2222-222222222222.png');
  });

  it('recusa URL de outra origem ou fora do prefixo de avatar', () => {
    expect(extractObjectPath('https://exemplo.com/foto.png')).toBeNull();
    expect(
      extractObjectPath(
        'https://exemplo.supabase.co/storage/v1/object/public/avatars/../../segredo.env'
      )
    ).toBeNull();
    expect(
      extractObjectPath(
        'https://exemplo.supabase.co/storage/v1/object/public/avatars/outro/arquivo.png'
      )
    ).toBeNull();
  });
});
