import { randomUUID } from 'node:crypto';
import { resolveSupabaseAuthConfig } from '@/lib/supabase/config';
import { buildAvatarObjectPath, validateAvatarFile } from '@/lib/storage/validate';

export const AVATAR_BUCKET = process.env.SUPABASE_AVATAR_BUCKET ?? 'avatars';

/**
 * Storage no Supabase por REST — sem `@supabase/*`, como manda a regra de
 * portabilidade (o específico de fornecedor fica isolado em `adapters/`).
 *
 * A escrita usa a service role key: é o único segredo capaz de gravar no bucket
 * a partir do servidor sem depender do token do usuário, e nunca sai daqui.
 */
function config() {
  const supabase = resolveSupabaseAuthConfig();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabase) {
    throw new Error('storage_not_configured');
  }

  if (!serviceRoleKey) {
    throw new Error('storage_service_key_missing');
  }

  return { url: supabase.url, serviceRoleKey };
}

export async function saveFileToSupabase(userId: string, file: File): Promise<{ url: string }> {
  const validation = validateAvatarFile(file);

  if (!validation.valid || !validation.extension) {
    throw new Error(validation.error ?? 'invalid_file_type');
  }

  const { url, serviceRoleKey } = config();
  const objectPath = buildAvatarObjectPath(userId, validation.extension, randomUUID());
  const endpoint = `${url}/storage/v1/object/${AVATAR_BUCKET}/${objectPath}`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${serviceRoleKey}`,
      apikey: serviceRoleKey,
      'Content-Type': file.type,
      // Substitui o avatar anterior do mesmo caminho em vez de falhar com 409.
      'x-upsert': 'true',
      'cache-control': 'public, max-age=31536000, immutable',
    },
    body: await file.arrayBuffer(),
    cache: 'no-store',
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(`storage_upload_failed: ${response.status} ${detail.slice(0, 200)}`);
  }

  return { url: `${url}/storage/v1/object/public/${AVATAR_BUCKET}/${objectPath}` };
}

/**
 * Apaga um objeto do bucket a partir da URL pública.
 *
 * Sem isto, cada troca de avatar deixaria o arquivo anterior órfão no bucket
 * para sempre — o caminho tem um sufixo único por envio, então `x-upsert` não
 * substitui nada.
 */
export async function deleteFileFromSupabase(publicUrl: string): Promise<void> {
  const objectPath = extractObjectPath(publicUrl);

  if (!objectPath) {
    return;
  }

  const { url, serviceRoleKey } = config();

  await fetch(`${url}/storage/v1/object/${AVATAR_BUCKET}/${objectPath}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${serviceRoleKey}`, apikey: serviceRoleKey },
    cache: 'no-store',
  });
}

/** Extrai o caminho dentro do bucket; devolve null para URL de outra origem. */
export function extractObjectPath(publicUrl: string): string | null {
  const marker = `/storage/v1/object/public/${AVATAR_BUCKET}/`;
  const index = publicUrl.indexOf(marker);

  if (index === -1) {
    return null;
  }

  const objectPath = publicUrl.slice(index + marker.length).split('?')[0];

  // Só apaga o que está sob o prefixo de avatar que nós mesmos escrevemos.
  return /^[0-9a-f-]{36}\/avatar-[0-9a-f-]{36}\.[a-z0-9]+$/i.test(objectPath) ? objectPath : null;
}
