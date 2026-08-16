import postgres, { type Sql } from 'postgres';
import { isUuid } from '@/lib/uuid';

const globalForDb = globalThis as typeof globalThis & {
  db?: Sql;
};

/** Role sem bypass de RLS assumida por toda operação em nome de um usuário. */
export const APP_ROLE = 'ligcentro_app';

function shouldUseSsl(databaseUrl: string): boolean {
  if (process.env.DATABASE_SSL === 'true') {
    return true;
  }

  return /supabase\.(com|co|in)/.test(databaseUrl);
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

  // O pool é guardado **sempre**, inclusive em produção.
  //
  // Antes, o cache valia só fora de produção: em produção cada chamada abria um
  // pool novo de até 10 conexões que nunca era fechado, e o banco caminhava para
  // `sorry, too many clients already` conforme o tráfego. O sintoma que revelou
  // isto foi a captura do manual falhando sempre por volta da 70ª página
  // servida (TCK-0024). A razão de existir um cache é justamente não abrir
  // conexão por requisição — inverter isso em produção anulava o propósito.
  globalForDb.db = db;

  return db;
}

/**
 * Executa consultas **em nome de um usuário**, com a RLS valendo.
 *
 * Dentro da transação: `app.current_user_id` recebe o dono e a role efetiva cai
 * para `ligcentro_app` (sem bypass de RLS, e não dona das tabelas). A partir daí
 * as políticas do banco — não o `WHERE` da aplicação — são o que impede um
 * tenant de ver outro. `SET LOCAL`/`set_config(..., true)` valem só até o fim da
 * transação, então a conexão volta ao normal ao ser devolvida ao pool.
 */
export async function withUserSession<T>(userId: string, run: (tx: Sql) => Promise<T>): Promise<T> {
  // O id vira o valor de `app.current_user_id`, que as políticas convertem para
  // uuid. Um id malformado faria a conversão estourar em toda consulta — 500 em
  // vez de resultado vazio — e no caminho mock esse id vem de cookie que o
  // usuário controla. Barrar aqui mantém o erro dentro da aplicação.
  if (!isUuid(userId)) {
    throw new Error('invalid_session_user_id');
  }

  const db = getDb();

  return db.begin(async (tx) => {
    await tx`SELECT set_config('app.current_user_id', ${userId}, true)`;
    await assumeAppRole(tx as unknown as Sql);

    return run(tx as unknown as Sql);
  }) as Promise<T>;
}

/**
 * Executa consultas do caminho público (visitante anônimo) sob a mesma role, mas
 * sem `app.current_user_id`: a política de owner não casa com NULL, então sobra
 * apenas a leitura de perfis publicados. É o banco garantindo que rascunho não
 * escapa, mesmo se a consulta esquecer o filtro.
 */
export async function withPublicSession<T>(run: (tx: Sql) => Promise<T>): Promise<T> {
  const db = getDb();

  return db.begin(async (tx) => {
    await assumeAppRole(tx as unknown as Sql);

    return run(tx as unknown as Sql);
  }) as Promise<T>;
}

/**
 * Assume a role da aplicação dentro da transação.
 *
 * O nome da role é constante do módulo, nunca entrada — daí o `unsafe`. Se a
 * migração 0006 não tiver sido aplicada, o Postgres responde `role ... does not
 * exist` e toda requisição autenticada quebraria com erro opaco; trocamos por
 * uma mensagem que diz o que fazer.
 */
async function assumeAppRole(tx: Sql): Promise<void> {
  try {
    await tx.unsafe(`SET LOCAL ROLE ${APP_ROLE}`);
  } catch (error) {
    if (error instanceof Error && /does not exist/i.test(error.message)) {
      throw new Error(
        `app_role_missing: a role "${APP_ROLE}" não existe no banco. Aplique as migrações de db/migrations/ em ordem (a 0006 cria a role) antes de subir esta versão.`
      );
    }

    throw error;
  }
}
