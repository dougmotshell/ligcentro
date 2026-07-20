import { mkdir, writeFile } from 'node:fs/promises';
import { extname } from 'node:path';
import { join } from 'node:path';

function sanitizeFileName(fileName: string): string {
  return fileName
    .normalize('NFKD')
    .replace(/[^a-zA-Z0-9._-]/g, '-')
    .replace(/-+/g, '-')
    .toLowerCase();
}

export async function saveFileLocally(userId: string, file: File): Promise<{ url: string }> {
  const safeName = sanitizeFileName(file.name || 'avatar');
  const extension = extname(safeName) || '.bin';
  const directory = join(process.cwd(), 'public', 'uploads', userId);
  await mkdir(directory, { recursive: true });

  const fileName = `${Date.now()}-${safeName.replace(extension, '')}${extension}`;
  const filePath = join(directory, fileName);
  const buffer = Buffer.from(await file.arrayBuffer());

  await writeFile(filePath, buffer);

  return {
    url: `/uploads/${userId}/${fileName}`,
  };
}
