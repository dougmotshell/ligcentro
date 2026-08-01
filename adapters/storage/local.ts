import { randomUUID } from 'node:crypto';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { buildAvatarObjectPath, validateAvatarFile } from '@/lib/storage/validate';

/**
 * Storage de desenvolvimento: grava em `public/uploads`.
 *
 * Aplica a **mesma** validação do caminho Supabase — inclusive derivando a
 * extensão do tipo declarado, nunca do nome enviado, que é entrada do usuário.
 */
export async function saveFileLocally(userId: string, file: File): Promise<{ url: string }> {
  const validation = validateAvatarFile(file);

  if (!validation.valid || !validation.extension) {
    throw new Error(validation.error ?? 'invalid_file_type');
  }

  const objectPath = buildAvatarObjectPath(userId, validation.extension, randomUUID());
  const filePath = join(process.cwd(), 'public', 'uploads', objectPath);

  await mkdir(join(filePath, '..'), { recursive: true });
  await writeFile(filePath, Buffer.from(await file.arrayBuffer()));

  return { url: `/uploads/${objectPath}` };
}

/** Remove o arquivo gravado localmente; ignora o que não é do nosso prefixo. */
export async function deleteFileLocally(url: string): Promise<void> {
  const match = /^\/uploads\/([0-9a-f-]{36}\/avatar-[0-9a-f-]{36}\.[a-z0-9]+)$/i.exec(url);

  if (!match) {
    return;
  }

  await rm(join(process.cwd(), 'public', 'uploads', match[1]), { force: true });
}
