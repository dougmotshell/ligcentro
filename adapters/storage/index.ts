interface StorageAdapter {
  saveFile(userId: string, file: File): Promise<{ url: string }>;
}

export function createStorageAdapter(): StorageAdapter {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { saveFileLocally } = require('./local') as {
      saveFileLocally(userId: string, file: File): Promise<{ url: string }>;
    };

    return {
      saveFile: saveFileLocally,
    };
  }

  return {
    async saveFile() {
      throw new Error('Supabase Storage ainda não foi configurado neste ambiente.');
    },
  };
}
