// @vitest-environment node
/**
 * Exclusão de conta contra o Postgres do `docker compose`: prova que a cascata
 * alcança tudo que é do titular e nada além. Sem banco alcançável, é pulado.
 */
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import postgres, { type Sql } from 'postgres';

const DATABASE_URL =
  process.env.DATABASE_URL ?? 'postgresql://ligcentro:ligcentro@localhost:5432/ligcentro';

const OWNER = '00000000-0000-0000-0000-0000000000d1';
const OTHER = '00000000-0000-0000-0000-0000000000d2';
const OWNER_PROFILE = '00000000-0000-0000-0000-0000000000d3';
const OTHER_PROFILE = '00000000-0000-0000-0000-0000000000d4';
const OWNER_BLOCK = '00000000-0000-0000-0000-0000000000d5';
const OTHER_BLOCK = '00000000-0000-0000-0000-0000000000d6';
const THIRD = '00000000-0000-0000-0000-0000000000d7';

let db: Sql;
let reachable = false;

async function asUser<T>(userId: string, run: (tx: Sql) => Promise<T>): Promise<T> {
  return db.begin(async (tx) => {
    await tx`SELECT set_config('app.current_user_id', ${userId}, true)`;
    await tx.unsafe('SET LOCAL ROLE ligcentro_app');
    return run(tx as unknown as Sql);
  }) as Promise<T>;
}

async function deleteAccount(userId: string): Promise<string | null> {
  const rows = (await asUser(
    userId,
    (tx) => tx`SELECT public.delete_account() AS handle`
  )) as unknown as Array<{ handle: string | null }>;

  return rows[0]?.handle ?? null;
}

async function seed() {
  await db`DELETE FROM profiles WHERE user_id IN (${OWNER}::uuid, ${OTHER}::uuid, ${THIRD}::uuid)`;
  await db`
    INSERT INTO profiles (id, user_id, handle, display_name, theme, status)
    VALUES
      (${OWNER_PROFILE}::uuid, ${OWNER}::uuid, 'del-owner', 'Dono', '{}'::jsonb, 'published'),
      (${OTHER_PROFILE}::uuid, ${OTHER}::uuid, 'del-other', 'Outro', '{}'::jsonb, 'published')
  `;
  await db`
    INSERT INTO blocks (id, profile_id, type, label, url, config, position, is_active)
    VALUES
      (${OWNER_BLOCK}::uuid, ${OWNER_PROFILE}::uuid, 'link', 'Do dono', 'https://a.dev', '{}'::jsonb, 0, TRUE),
      (${OTHER_BLOCK}::uuid, ${OTHER_PROFILE}::uuid, 'link', 'Do outro', 'https://b.dev', '{}'::jsonb, 0, TRUE)
  `;
  await db`
    INSERT INTO page_views (profile_id, day, country, referrer_host, count)
    VALUES
      (${OWNER_PROFILE}::uuid, CURRENT_DATE, 'BR', 'a.dev', 3),
      (${OTHER_PROFILE}::uuid, CURRENT_DATE, 'BR', 'b.dev', 5)
  `;
  await db`
    INSERT INTO block_clicks (block_id, profile_id, day, count)
    VALUES
      (${OWNER_BLOCK}::uuid, ${OWNER_PROFILE}::uuid, CURRENT_DATE, 2),
      (${OTHER_BLOCK}::uuid, ${OTHER_PROFILE}::uuid, CURRENT_DATE, 4)
  `;
}

async function countFor(profileId: string) {
  const [row] = (await db`
    SELECT
      (SELECT COUNT(*) FROM profiles WHERE id = ${profileId}::uuid)::int AS perfis,
      (SELECT COUNT(*) FROM blocks WHERE profile_id = ${profileId}::uuid)::int AS blocos,
      (SELECT COUNT(*) FROM page_views WHERE profile_id = ${profileId}::uuid)::int AS visitas,
      (SELECT COUNT(*) FROM block_clicks WHERE profile_id = ${profileId}::uuid)::int AS cliques
  `) as unknown as Array<{ perfis: number; blocos: number; visitas: number; cliques: number }>;

  return row;
}

beforeAll(async () => {
  db = postgres(DATABASE_URL, { ssl: false, max: 2, connect_timeout: 5 });

  try {
    await db`SELECT 1`;
    reachable = true;
  } catch {
    /* ambiente sem banco: os casos são pulados */
  }
});

beforeEach(async () => {
  if (reachable) {
    await seed();
  }
});

afterAll(async () => {
  if (reachable) {
    await db`DELETE FROM profiles WHERE user_id IN (${OWNER}::uuid, ${OTHER}::uuid, ${THIRD}::uuid)`;
  }

  await db?.end({ timeout: 5 });
});

describe('delete_account', () => {
  it('apaga perfil, blocos, visitas e cliques do titular', async () => {
    if (!reachable) return;

    expect(await deleteAccount(OWNER)).toBe('del-owner');
    expect(await countFor(OWNER_PROFILE)).toEqual({
      perfis: 0,
      blocos: 0,
      visitas: 0,
      cliques: 0,
    });
  });

  it('não toca nos dados de outro titular', async () => {
    if (!reachable) return;

    await deleteAccount(OWNER);

    expect(await countFor(OTHER_PROFILE)).toEqual({
      perfis: 1,
      blocos: 1,
      visitas: 1,
      cliques: 1,
    });
  });

  it('libera o handle para outra pessoa', async () => {
    if (!reachable) return;

    await deleteAccount(OWNER);

    // Reusar o handle prova que ficou livre. Precisa ser um terceiro usuário:
    // `profiles.user_id` é único desde o TCK-0009, então OTHER já tem perfil.
    await db`
      INSERT INTO profiles (user_id, handle, display_name, theme, status)
      VALUES (${THIRD}::uuid, 'del-owner', 'Novo dono do handle', '{}'::jsonb, 'draft')
    `;

    const rows =
      (await db`SELECT user_id FROM profiles WHERE handle = 'del-owner'`) as unknown as Array<{
        user_id: string;
      }>;
    expect(rows[0].user_id).toBe(THIRD);
  });

  it('devolve null quando não havia perfil, sem lançar', async () => {
    if (!reachable) return;

    await deleteAccount(OWNER);

    expect(await deleteAccount(OWNER)).toBeNull();
  });

  it('não aceita apagar a conta de outro: o alcance vem da sessão, não de argumento', async () => {
    if (!reachable) return;

    // A versão anterior recebia o id como parâmetro e, sendo SECURITY DEFINER,
    // apagava a conta indicada — atuando como A dava para apagar B. A assinatura
    // com argumento não existe mais.
    await expect(
      asUser(OWNER, (tx) => tx`SELECT public.delete_account(${OTHER}::uuid) AS handle`)
    ).rejects.toThrow(/does not exist/i);

    expect(await countFor(OTHER_PROFILE)).toEqual({
      perfis: 1,
      blocos: 1,
      visitas: 1,
      cliques: 1,
    });
  });

  it('exige contexto de sessão — sem app.current_user_id, não apaga nada', async () => {
    if (!reachable) return;

    await expect(
      db.begin(async (tx) => {
        await tx.unsafe('SET LOCAL ROLE ligcentro_app');
        return tx`SELECT public.delete_account() AS handle`;
      })
    ).rejects.toThrow(/app\.current_user_id/);
  });
});
