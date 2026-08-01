#!/usr/bin/env node
/**
 * Runner de migrações.
 *
 * Antes disto, `npm run db:migrate` aplicava **apenas** a 0001 e nada registrava
 * o que já havia sido aplicado — a ordem correta dependia de memória humana, o
 * que já causou uma quebra (o código do TCK-0011 exige a role da 0006).
 *
 * Uso:
 *   npm run db:migrate              aplica as pendentes, em ordem
 *   npm run db:migrate -- --status  só lista o estado
 *   npm run db:migrate -- --baseline 0008
 *       marca como aplicadas, sem executar, todas as migrações até a versão
 *       indicada. É o caminho para adotar o runner num banco que já foi migrado
 *       à mão (produção): sem isso, ele tentaria reaplicar a 0001, que cria
 *       políticas e falharia.
 */
import { readdir, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import postgres from 'postgres';

const MIGRATIONS_DIR = join(process.cwd(), 'db', 'migrations');

const args = process.argv.slice(2);
const statusOnly = args.includes('--status');
const baselineIndex = args.indexOf('--baseline');
const baselineVersion = baselineIndex === -1 ? null : args[baselineIndex + 1];

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('DATABASE_URL não definida.');
  process.exit(1);
}

const useSsl = process.env.DATABASE_SSL === 'true' || /supabase\.(com|co|in)/.test(databaseUrl);
const sql = postgres(databaseUrl, { ssl: useSsl ? 'require' : false, max: 1 });

function checksumOf(content) {
  return createHash('sha256').update(content).digest('hex').slice(0, 16);
}

async function loadMigrations() {
  const files = (await readdir(MIGRATIONS_DIR)).filter((name) => name.endsWith('.sql')).sort();

  return Promise.all(
    files.map(async (file) => {
      const content = await readFile(join(MIGRATIONS_DIR, file), 'utf8');

      return { version: file.slice(0, 4), file, content, checksum: checksumOf(content) };
    })
  );
}

async function ensureTrackingTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version TEXT PRIMARY KEY,
      file TEXT NOT NULL,
      checksum TEXT NOT NULL,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
}

async function appliedVersions() {
  const rows = await sql`SELECT version, checksum FROM schema_migrations`;

  return new Map(rows.map((row) => [row.version, row.checksum]));
}

let exitCode = 0;

try {
  await ensureTrackingTable();

  const migrations = await loadMigrations();
  const applied = await appliedVersions();

  if (statusOnly) {
    for (const migration of migrations) {
      const previous = applied.get(migration.version);
      const state = !previous
        ? 'PENDENTE'
        : previous === migration.checksum
          ? 'aplicada'
          : 'aplicada (ARQUIVO ALTERADO DEPOIS)';
      console.log(`${migration.version} ${migration.file.padEnd(34)} ${state}`);
    }
  } else if (baselineVersion) {
    const target = baselineVersion.padStart(4, '0');
    const marked = [];

    for (const migration of migrations) {
      if (migration.version > target || applied.has(migration.version)) {
        continue;
      }

      await sql`
        INSERT INTO schema_migrations (version, file, checksum)
        VALUES (${migration.version}, ${migration.file}, ${migration.checksum})
      `;
      marked.push(migration.version);
    }

    console.log(
      marked.length
        ? `Marcadas como aplicadas sem executar (até ${target}): ${marked.join(', ')}`
        : `Nada a marcar até ${target}.`
    );
  } else {
    const pending = migrations.filter((migration) => !applied.has(migration.version));

    // Arquivo já aplicado que mudou de conteúdo: avisa, mas não reaplica —
    // migração aplicada é imutável, correção vira migração nova.
    for (const migration of migrations) {
      const previous = applied.get(migration.version);
      if (previous && previous !== migration.checksum) {
        console.warn(
          `AVISO: ${migration.file} foi alterado depois de aplicado. Correção deve virar uma migração nova.`
        );
      }
    }

    if (!pending.length) {
      console.log('Nenhuma migração pendente.');
    }

    for (const migration of pending) {
      process.stdout.write(`Aplicando ${migration.file}... `);

      // Cada migração roda em transação própria: uma falha não deixa a anterior
      // pela metade nem impede saber onde parou.
      await sql.begin(async (tx) => {
        await tx.unsafe(migration.content);
        await tx`
          INSERT INTO schema_migrations (version, file, checksum)
          VALUES (${migration.version}, ${migration.file}, ${migration.checksum})
        `;
      });

      console.log('ok');
    }
  }
} catch (error) {
  console.error('\nFalha na migração:', error.message);
  exitCode = 1;
} finally {
  await sql.end({ timeout: 5 });
}

process.exit(exitCode);
