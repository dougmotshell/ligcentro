import { getDb, withUserSession } from '@/lib/db/client';
import type { Block, ProfileWithBlocks } from '@/lib/db/types';
import { getDashboardProfile, listDashboardBlocks } from '@/lib/db/dashboard';
import type { AuthSession } from '@/adapters/auth';

function parseJsonBody<T>(value: T): T {
  return value;
}

// A ingestão (visita/clique) segue na role de serviço: é chamada por visitante
// anônimo e o upsert precisa de UPDATE nas tabelas agregadas. O endurecimento
// dessa borda — validação de vínculo, limite de taxa e função SECURITY DEFINER
// para o incremento — é o TCK-0012.
export async function recordProfileView(
  profileId: string,
  country: string | null,
  referrerHost: string | null
) {
  const db = getDb();
  await db`
    INSERT INTO page_views (profile_id, day, country, referrer_host, count)
    VALUES (${profileId}::uuid, CURRENT_DATE, ${country}, ${referrerHost}, 1)
    ON CONFLICT (profile_id, day, country, referrer_host)
    DO UPDATE SET count = page_views.count + 1
  `;
}

export async function recordBlockClick(blockId: string, profileId: string) {
  const db = getDb();
  await db`
    INSERT INTO block_clicks (block_id, profile_id, day, count)
    VALUES (${blockId}::uuid, ${profileId}::uuid, CURRENT_DATE, 1)
    ON CONFLICT (block_id, day)
    DO UPDATE SET count = block_clicks.count + 1
  `;
}

export async function getAnalyticsOverview(userId: string, profileId: string) {
  return withUserSession(userId, async (tx) => {
    const totals = (await tx`
    WITH views AS (
      SELECT COALESCE(SUM(count), 0) AS total_views
      FROM page_views
      WHERE profile_id = ${profileId}::uuid
        AND day >= CURRENT_DATE - INTERVAL '29 days'
    ), clicks AS (
      SELECT COALESCE(SUM(count), 0) AS total_clicks
      FROM block_clicks
      WHERE profile_id = ${profileId}::uuid
        AND day >= CURRENT_DATE - INTERVAL '29 days'
    )
    SELECT views.total_views, clicks.total_clicks
    FROM views, clicks
  `) as unknown as Array<{ total_views: number; total_clicks: number }>;

    const series = (await tx`
    WITH days AS (
      SELECT generate_series(CURRENT_DATE - INTERVAL '29 days', CURRENT_DATE, INTERVAL '1 day')::date AS day
    ), view_series AS (
      SELECT day, SUM(count) AS views
      FROM page_views
      WHERE profile_id = ${profileId}::uuid
        AND day >= CURRENT_DATE - INTERVAL '29 days'
      GROUP BY day
    ), click_series AS (
      SELECT day, SUM(count) AS clicks
      FROM block_clicks
      WHERE profile_id = ${profileId}::uuid
        AND day >= CURRENT_DATE - INTERVAL '29 days'
      GROUP BY day
    )
    SELECT
      days.day,
      COALESCE(view_series.views, 0)::int AS views,
      COALESCE(click_series.clicks, 0)::int AS clicks
    FROM days
    LEFT JOIN view_series ON view_series.day = days.day
    LEFT JOIN click_series ON click_series.day = days.day
    ORDER BY days.day ASC
  `) as unknown as Array<{ day: string; views: number; clicks: number }>;

    const topBlocks = (await tx`
    SELECT
      b.id,
      b.label,
      b.type,
      COALESCE(SUM(c.count), 0)::int AS clicks
    FROM blocks b
    LEFT JOIN block_clicks c ON c.block_id = b.id
      AND c.day >= CURRENT_DATE - INTERVAL '29 days'
    WHERE b.profile_id = ${profileId}::uuid
    GROUP BY b.id
    ORDER BY clicks DESC, b.position ASC
    LIMIT 5
  `) as unknown as Array<{ id: string; label: string | null; type: string; clicks: number }>;

    const totalViews = totals[0]?.total_views ?? 0;
    const totalClicks = totals[0]?.total_clicks ?? 0;

    return {
      totalViews,
      totalClicks,
      ctr: totalViews > 0 ? totalClicks / totalViews : 0,
      series,
      topBlocks,
    };
  });
}

export async function exportProfileData(session: AuthSession): Promise<{
  profile: ProfileWithBlocks;
  analytics: Awaited<ReturnType<typeof getAnalyticsOverview>>;
  blocks: Block[];
}> {
  const profile = await getDashboardProfile(session);

  if (!profile) {
    throw new Error('profile_not_found');
  }

  const blocks = await listDashboardBlocks(session.id, profile.id);
  const analytics = await getAnalyticsOverview(session.id, profile.id);

  return {
    profile,
    blocks,
    analytics: parseJsonBody(analytics),
  };
}
