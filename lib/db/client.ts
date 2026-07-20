import postgres, { type Sql } from 'postgres';

// Singleton para evitar múltiplas conexões em dev com hot reload.
const globalForDb = globalThis as typeof globalThis & {
  db?: Sql;
};

export function getDb(): Sql {
  if (globalForDb.db) {
    return globalForDb.db;
  }

  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error('DATABASE_URL não definida.');
  }

  const db = postgres(databaseUrl, {
    ssl: process.env.NODE_ENV === 'production' ? 'require' : false,
    max: 10,
  });

  if (process.env.NODE_ENV !== 'production') {
    globalForDb.db = db;
  }

  return db;
}
