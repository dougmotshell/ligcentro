import postgres, { type Sql } from 'postgres';

const globalForDb = globalThis as typeof globalThis & {
  db?: Sql;
};

function shouldUseSsl(databaseUrl: string): boolean {
  if (process.env.DATABASE_SSL === 'true') {
    return true;
  }

  return /supabase\.(co|in)/.test(databaseUrl);
}

export function getDb(): Sql {
  if (globalForDb.db) {
    return globalForDb.db;
  }

  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error('DATABASE_URL não definida.');
  }

  const db = postgres(databaseUrl, {
    ssl: shouldUseSsl(databaseUrl) ? 'require' : false,
    max: 10,
  });

  if (process.env.NODE_ENV !== 'production') {
    globalForDb.db = db;
  }

  return db;
}
