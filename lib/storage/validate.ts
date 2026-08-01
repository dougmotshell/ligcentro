/**
 * Regras do arquivo de avatar — puras, para valerem igual em qualquer adaptador.
 */

/** Tipos aceitos e a extensão canônica de cada um. */
export const ACCEPTED_IMAGE_TYPES: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/avif': 'avif',
};

export const MAX_AVATAR_SIZE_IN_BYTES = 2 * 1024 * 1024;

export type FileValidationError = 'invalid_file_type' | 'file_too_large' | 'empty_file';

export interface FileValidationResult {
  valid: boolean;
  error?: FileValidationError;
  extension?: string;
}

export function validateAvatarFile(file: { type: string; size: number }): FileValidationResult {
  const extension = ACCEPTED_IMAGE_TYPES[file.type?.toLowerCase()];

  if (!extension) {
    return { valid: false, error: 'invalid_file_type' };
  }

  if (file.size <= 0) {
    return { valid: false, error: 'empty_file' };
  }

  if (file.size > MAX_AVATAR_SIZE_IN_BYTES) {
    return { valid: false, error: 'file_too_large' };
  }

  return { valid: true, extension };
}

/**
 * Caminho do objeto no bucket.
 *
 * Deriva a extensão do tipo declarado, não do nome enviado: nome de arquivo é
 * entrada do usuário e não deve virar caminho.
 */
export function buildAvatarObjectPath(
  userId: string,
  extension: string,
  uniqueSuffix: string
): string {
  return `${userId}/avatar-${uniqueSuffix}.${extension}`;
}
