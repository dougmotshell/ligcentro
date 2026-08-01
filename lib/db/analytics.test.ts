// @vitest-environment node
/**
 * Integridade da ingestão de analytics, contra o Postgres do `docker compose`.
 * Sem banco alcançável o arquivo é pulado (o CI o roda com o serviço ligado).
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import postgres, { type Sql } from 'postgres';

const DATABASE_URL =
  process.env.DATABASE_URL ?? 'postgresql://ligcentro:ligcentro@localhost:5432/ligcentro';

const USER = '00000000-0000-0000-0000-0000000000c1';
const PUBLISHED_PROFILE = '00000000-0000-0000-0000-0000000000c2';
const DRAFT_PROFILE = '00000000-0000-0000-0000-0000000000c3';
const OTHER_USER = '00000000-0000-0000-0000-0000000000c4';
const BLOCK = '00000000-0000-0000-0000-0000000000c5';
const OTHER_BLOCK = '00000000-0000-0000-0000-0000000000c6';

let db: Sql;
let reachable = false;

/** Ingestão como a role da aplicação — o mesmo caminho de `withPublicSession`. */
async function ingest<T>(run: (tx: Sql) => Promise<T>): Promise<T> {
  return db.begin(async (tx) => {
    await tx.unsafe('SET LOCAL ROLE ligcentro_app');
    return run(tx as unknown as Sql);
  }) as Promise<T>;
}

async function recordView(profileId: string, country: string | null, referrer: string | null) {
  const rows = (await ingest(
    (tx) => tx`SELECT public.record_page_view(${profileId}::uuid, ${country}, ${referrer}) AS ok`
  )) as unknown as Array<{ ok: boolean }>;

  return rows[0]?.ok === true;
}

async function recordClick(blockId: string, profileId: string) {
  const rows = (await ingest(
    (tx) => tx`SELECT public.record_block_click(${blockId}::uuid, ${profileId}::uuid) AS ok`
  )) as unknown as Array<{ ok: boolean }>;

  return rows[0]?.ok === true;
}

beforeAll(async () => {
  db = postgres(DATABASE_URL, { ssl: false, max: 2, connect_timeout: 5 });

  try {
    await db`SELECT 1`;
    reachable = true;
  } catch {
    return;
  }

  await db`DELETE FROM profiles WHERE user_id IN (${USER}::uuid, ${OTHER_USER}::uuid)`;
  await db`
    INSERT INTO profiles (id, user_id, handle, display_name, theme, status)
    VALUES
      (${PUBLISHED_PROFILE}::uuid, ${USER}::uuid, 'ing-pub', 'Publicado', '{}'::jsonb, 'published'),
      (${DRAFT_PROFILE}::uuid, ${OTHER_USER}::uuid, 'ing-draft', 'Rascunho', '{}'::jsonb, 'draft')
  `;
  await db`
    INSERT INTO blocks (id, profile_id, type, label, url, config, position, is_active)
    VALUES
      (${BLOCK}::uuid, ${PUBLISHED_PROFILE}::uuid, 'link', 'Do publicado', 'https://a.dev', '{}'::jsonb, 0, TRUE),
      (${OTHER_BLOCK}::uuid, ${DRAFT_PROFILE}::uuid, 'link', 'Do rascunho', 'https://b.dev', '{}'::jsonb, 0, TRUE)
  `;
});

afterAll(async () => {
  if (reachable) {
    await db`DELETE FROM profiles WHERE user_id IN (${USER}::uuid, ${OTHER_USER}::uuid)`;
  }

  await db?.end({ timeout: 5 });
});

describe('ingestão de visitas', () => {
  it('incrementa a mesma linha quando país e referrer são nulos', async () => {
    if (!reachable) return;

    expect(await recordView(PUBLISHED_PROFILE, null, null)).toBe(true);
    expect(await recordView(PUBLISHED_PROFILE, null, null)).toBe(true);
    expect(await recordView(PUBLISHED_PROFILE, null, null)).toBe(true);

    const rows = (await db`
      SELECT COUNT(*)::int AS linhas, COALESCE(SUM(count), 0)::int AS total
      FROM page_views WHERE profile_id = ${PUBLISHED_PROFILE}::uuid
    `) as unknown as Array<{ linhas: number; total: number }>;

    // O defeito antigo daria linhas = 3.
    expect(rows[0]).toEqual({ linhas: 1, total: 3 });
  });

  it('separa linhas por país e referrer quando eles existem', async () => {
    if (!reachable) return;

    await recordView(PUBLISHED_PROFILE, 'BR', 'instagram.com');
    await recordView(PUBLISHED_PROFILE, 'BR', 'instagram.com');
    await recordView(PUBLISHED_PROFILE, 'PT', 'instagram.com');

    const rows = (await db`
      SELECT country, count FROM page_views
      WHERE profile_id = ${PUBLISHED_PROFILE}::uuid AND country IS NOT NULL
      ORDER BY country
    `) as unknown as Array<{ country: string; count: number }>;

    expect(rows).toEqual([
      { country: 'BR', count: 2 },
      { country: 'PT', count: 1 },
    ]);
  });

  it('recusa perfil inexistente', async () => {
    if (!reachable) return;

    expect(await recordView('99999999-9999-9999-9999-999999999999', null, null)).toBe(false);
  });

  it('recusa perfil que não está publicado', async () => {
    if (!reachable) return;

    expect(await recordView(DRAFT_PROFILE, null, null)).toBe(false);

    const rows = (await db`
      SELECT COUNT(*)::int AS linhas FROM page_views WHERE profile_id = ${DRAFT_PROFILE}::uuid
    `) as unknown as Array<{ linhas: number }>;
    expect(rows[0].linhas).toBe(0);
  });
});

describe('ingestão de cliques', () => {
  it('aceita bloco que pertence ao perfil informado', async () => {
    if (!reachable) return;

    expect(await recordClick(BLOCK, PUBLISHED_PROFILE)).toBe(true);
    expect(await recordClick(BLOCK, PUBLISHED_PROFILE)).toBe(true);

    const rows = (await db`
      SELECT count FROM block_clicks WHERE block_id = ${BLOCK}::uuid
    `) as unknown as Array<{ count: number }>;
    expect(rows[0].count).toBe(2);
  });

  it('recusa bloco que não pertence ao perfil informado', async () => {
    if (!reachable) return;

    expect(await recordClick(OTHER_BLOCK, PUBLISHED_PROFILE)).toBe(false);
    expect(await recordClick(BLOCK, DRAFT_PROFILE)).toBe(false);
  });

  it('recusa bloco de perfil não publicado', async () => {
    if (!reachable) return;

    expect(await recordClick(OTHER_BLOCK, DRAFT_PROFILE)).toBe(false);
  });
});

describe('permissões da role da aplicação', () => {
  it('não escreve direto nas tabelas agregadas — só pelas funções', async () => {
    if (!reachable) return;

    await expect(
      ingest(
        (tx) => tx`
          INSERT INTO page_views (profile_id, day, count)
          VALUES (${PUBLISHED_PROFILE}::uuid, CURRENT_DATE, 999)
        `
      )
    ).rejects.toThrow(/permission denied/i);
  });
});

describe('expurgo de retenção', () => {
  it('remove o que passou da janela e preserva o resto', async () => {
    if (!reachable) return;

    await db`
      INSERT INTO page_views (profile_id, day, country, referrer_host, count)
      VALUES (${PUBLISHED_PROFILE}::uuid, CURRENT_DATE - 800, 'BR', 'antigo.dev', 5)
    `;

    const [result] = (await db`SELECT * FROM public.purge_old_analytics(730)`) as unknown as Array<{
      deleted_page_views: string;
    }>;

    expect(Number(result.deleted_page_views)).toBeGreaterThanOrEqual(1);

    const remaining = (await db`
      SELECT COUNT(*)::int AS linhas FROM page_views
      WHERE profile_id = ${PUBLISHED_PROFILE}::uuid AND day = CURRENT_DATE - 800
    `) as unknown as Array<{ linhas: number }>;
    expect(remaining[0].linhas).toBe(0);
  });

  it('recusa janela de retenção inválida', async () => {
    if (!reachable) return;

    await expect(db`SELECT * FROM public.purge_old_analytics(0)`).rejects.toThrow(/retention_days/);
  });
});
