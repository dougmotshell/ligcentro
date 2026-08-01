// @vitest-environment node
/**
 * Teste de acesso cruzado exigido pela regra 6 do AGENTS.md: toda migração que
 * toca isolamento multi-tenant vem acompanhada da prova, com dois usuários fake,
 * de que um não alcança os dados do outro.
 *
 * Roda contra o Postgres do `docker compose` (`DATABASE_URL`). Sem banco
 * alcançável o arquivo é pulado — o CI o executa com o serviço de Postgres
 * ligado (TCK-0016).
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import postgres, { type Sql } from 'postgres';

const DATABASE_URL =
  process.env.DATABASE_URL ?? 'postgresql://ligcentro:ligcentro@localhost:5432/ligcentro';

const USER_A = '00000000-0000-0000-0000-0000000000aa';
const USER_B = '00000000-0000-0000-0000-0000000000bb';
const PROFILE_A = '00000000-0000-0000-0000-0000000000a1';
const PROFILE_B = '00000000-0000-0000-0000-0000000000b1';

let db: Sql;
let databaseIsReachable = false;

/** Executa como a role da aplicação, no contexto de um usuário (ou anônimo). */
async function asUser<T>(userId: string | null, run: (tx: Sql) => Promise<T>): Promise<T> {
  return db.begin(async (tx) => {
    if (userId) {
      await tx`SELECT set_config('app.current_user_id', ${userId}, true)`;
    }
    await tx.unsafe('SET LOCAL ROLE ligcentro_app');

    return run(tx as unknown as Sql);
  }) as Promise<T>;
}

beforeAll(async () => {
  db = postgres(DATABASE_URL, { ssl: false, max: 2, connect_timeout: 5 });

  try {
    await db`SELECT 1`;
    databaseIsReachable = true;
  } catch {
    return;
  }

  await db`DELETE FROM profiles WHERE user_id IN (${USER_A}::uuid, ${USER_B}::uuid)`;

  // A publicado, B em rascunho — cobre leitura pública e leitura de dono.
  await db`
    INSERT INTO profiles (id, user_id, handle, display_name, theme, status)
    VALUES
      (${PROFILE_A}::uuid, ${USER_A}::uuid, 'rls-user-a', 'Usuário A', '{}'::jsonb, 'published'),
      (${PROFILE_B}::uuid, ${USER_B}::uuid, 'rls-user-b', 'Usuário B', '{}'::jsonb, 'draft')
  `;
  await db`
    INSERT INTO blocks (profile_id, type, label, url, config, position, is_active)
    VALUES
      (${PROFILE_A}::uuid, 'link', 'Link de A', 'https://a.exemplo', '{}'::jsonb, 0, TRUE),
      (${PROFILE_B}::uuid, 'link', 'Link de B', 'https://b.exemplo', '{}'::jsonb, 0, TRUE)
  `;
  await db`
    INSERT INTO page_views (profile_id, day, country, referrer_host, count)
    VALUES (${PROFILE_B}::uuid, CURRENT_DATE, 'BR', 'exemplo.dev', 7)
  `;
});

afterAll(async () => {
  if (databaseIsReachable) {
    await db`DELETE FROM profiles WHERE user_id IN (${USER_A}::uuid, ${USER_B}::uuid)`;
  }

  await db?.end({ timeout: 5 });
});

describe.runIf(process.env.SKIP_DB_TESTS !== 'true')(
  'RLS — acesso cruzado entre dois usuários',
  () => {
    it('a role da aplicação existe e não bypassa RLS', async () => {
      if (!databaseIsReachable) return;

      const rows = (await db`
      SELECT rolbypassrls, rolsuper FROM pg_roles WHERE rolname = 'ligcentro_app'
    `) as unknown as Array<{ rolbypassrls: boolean; rolsuper: boolean }>;

      expect(rows[0], 'migração 0006 precisa estar aplicada').toBeDefined();
      expect(rows[0].rolbypassrls).toBe(false);
      expect(rows[0].rolsuper).toBe(false);
    });

    it('A não lê o perfil em rascunho de B', async () => {
      if (!databaseIsReachable) return;

      const rows = await asUser(
        USER_A,
        (tx) => tx`SELECT id FROM profiles WHERE id = ${PROFILE_B}::uuid`
      );

      expect(rows).toHaveLength(0);
    });

    it('A lê o próprio perfil', async () => {
      if (!databaseIsReachable) return;

      const rows = await asUser(
        USER_A,
        (tx) => tx`SELECT id FROM profiles WHERE id = ${PROFILE_A}::uuid`
      );

      expect(rows).toHaveLength(1);
    });

    it('A não altera o perfil de B', async () => {
      if (!databaseIsReachable) return;

      const rows = await asUser(
        USER_A,
        (tx) =>
          tx`UPDATE profiles SET display_name = 'invadido' WHERE id = ${PROFILE_B}::uuid RETURNING id`
      );

      expect(rows).toHaveLength(0);

      const check =
        (await db`SELECT display_name FROM profiles WHERE id = ${PROFILE_B}::uuid`) as unknown as Array<{
          display_name: string;
        }>;
      expect(check[0].display_name).toBe('Usuário B');
    });

    it('A não apaga o perfil de B', async () => {
      if (!databaseIsReachable) return;

      const rows = await asUser(
        USER_A,
        (tx) => tx`DELETE FROM profiles WHERE id = ${PROFILE_B}::uuid RETURNING id`
      );

      expect(rows).toHaveLength(0);
    });

    it('A não lê nem altera os blocos de B', async () => {
      if (!databaseIsReachable) return;

      const read = await asUser(
        USER_A,
        (tx) => tx`SELECT id FROM blocks WHERE profile_id = ${PROFILE_B}::uuid`
      );
      expect(read).toHaveLength(0);

      const written = await asUser(
        USER_A,
        (tx) =>
          tx`UPDATE blocks SET label = 'invadido' WHERE profile_id = ${PROFILE_B}::uuid RETURNING id`
      );
      expect(written).toHaveLength(0);
    });

    it('A não insere bloco no perfil de B', async () => {
      if (!databaseIsReachable) return;

      await expect(
        asUser(
          USER_A,
          (tx) => tx`
          INSERT INTO blocks (profile_id, type, label, url, config, position, is_active)
          VALUES (${PROFILE_B}::uuid, 'link', 'intruso', 'https://intruso.exemplo', '{}'::jsonb, 9, TRUE)
        `
        )
      ).rejects.toThrow();
    });

    it('A não lê o analytics de B', async () => {
      if (!databaseIsReachable) return;

      const rows = await asUser(
        USER_A,
        (tx) => tx`SELECT count FROM page_views WHERE profile_id = ${PROFILE_B}::uuid`
      );

      expect(rows).toHaveLength(0);
    });

    it('B lê o próprio analytics', async () => {
      if (!databaseIsReachable) return;

      const rows = (await asUser(
        USER_B,
        (tx) => tx`SELECT count FROM page_views WHERE profile_id = ${PROFILE_B}::uuid`
      )) as unknown as Array<{ count: number }>;

      expect(rows[0]?.count).toBe(7);
    });

    it('visitante anônimo lê perfil publicado e não vê rascunho', async () => {
      if (!databaseIsReachable) return;

      const published = await asUser(
        null,
        (tx) => tx`SELECT id FROM profiles WHERE id = ${PROFILE_A}::uuid`
      );
      expect(published).toHaveLength(1);

      const draft = await asUser(
        null,
        (tx) => tx`SELECT id FROM profiles WHERE id = ${PROFILE_B}::uuid`
      );
      expect(draft).toHaveLength(0);
    });

    it('visitante anônimo não escreve em perfil nenhum', async () => {
      if (!databaseIsReachable) return;

      const rows = await asUser(
        null,
        (tx) =>
          tx`UPDATE profiles SET display_name = 'anônimo' WHERE id = ${PROFILE_A}::uuid RETURNING id`
      );

      expect(rows).toHaveLength(0);
    });
  }
);
