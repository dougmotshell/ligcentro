import { isSupabaseAuthConfigured } from '@/lib/supabase/config';
import { deleteFileLocally, saveFileLocally } from './local';
import { deleteFileFromSupabase, saveFileToSupabase } from './supabase';

interface StorageAdapter {
  saveFile(userId: string, file: File): Promise<{ url: string }>;
  /**
   * Remove um objeto pela URL que `saveFile` devolveu. Best-effort: a limpeza do
   * avatar antigo não pode derrubar a troca do novo.
   */
  deleteFileByUrl(url: string): Promise<void>;
}

/**
 * Com Supabase configurado, grava no bucket; sem ele, no disco local.
 *
 * O fallback local existe para desenvolvimento e para o `docker compose` — em
 * hospedagem com sistema de arquivos efêmero ou somente-leitura (Vercel) ele não
 * serve, e é justamente por isso que o caminho Supabase precisa existir.
 */
export function createStorageAdapter(): StorageAdapter {
  if (isSupabaseAuthConfigured()) {
    return { saveFile: saveFileToSupabase, deleteFileByUrl: deleteFileFromSupabase };
  }

  return { saveFile: saveFileLocally, deleteFileByUrl: deleteFileLocally };
}

export { AVATAR_BUCKET } from './supabase';
