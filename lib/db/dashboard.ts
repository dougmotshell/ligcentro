import { getDb } from '@/lib/db/client';
import type { Block, Profile, ProfileWithBlocks, ThemeConfig } from '@/lib/db/types';
import type { AuthSession } from '@/adapters/auth';
import type { NormalizedBlockPayload } from '@/lib/blocks/normalize';
import { normalizeTheme } from '@/lib/theme/presets';

function resolveProfileFilters(session: AuthSession) {
  return {
    profileId: session.profileId ?? null,
    userId: session.id,
    handle: session.handle,
  };
}

function parseJsonRecord(value: unknown): Record<string, unknown> {
  if (typeof value === 'string') {
    try {
      return parseJsonRecord(JSON.parse(value));
    } catch {
      return {};
    }
  }

  if (!value || typeof value !== 'object') {
    return {};
  }

  return value as Record<string, unknown>;
}

function mapBlock(block: Block): Block {
  return {
    ...block,
    config: parseJsonRecord(block.config),
  };
}

export async function isHandleAvailable(handle: string, excludeProfileId?: string): Promise<boolean> {
  const db = getDb();
  const rows = (await db`
    SELECT EXISTS(
      SELECT 1
      FROM profiles
      WHERE handle = ${handle}
        AND (${excludeProfileId ?? null}::uuid IS NULL OR id <> ${excludeProfileId ?? null}::uuid)
    ) AS exists
  `) as unknown as Array<{ exists: boolean }>;

  return !rows[0]?.exists;
}

export async function getDashboardProfile(session: AuthSession): Promise<ProfileWithBlocks | null> {
  const db = getDb();
  const { profileId, userId, handle } = resolveProfileFilters(session);
  const rows = (await db`
    SELECT
      p.*,
      COALESCE(
        json_agg(b ORDER BY b.position) FILTER (WHERE b.id IS NOT NULL),
        '[]'::json
      ) AS blocks
    FROM profiles p
    LEFT JOIN blocks b ON b.profile_id = p.id
    WHERE (
      (${profileId}::uuid IS NOT NULL AND p.id = ${profileId}::uuid)
      OR p.user_id = ${userId}::uuid
      OR p.handle = ${handle}
    )
    GROUP BY p.id
    ORDER BY p.created_at ASC
    LIMIT 1
  `) as unknown as ProfileWithBlocks[];

  if (!rows[0]) {
    return null;
  }

  return {
    ...rows[0],
    theme: normalizeTheme(rows[0].theme),
    blocks: (rows[0].blocks ?? []).map(mapBlock),
  };
}

export async function updateDashboardProfile(
  profileId: string,
  input: {
    displayName?: string;
    bio?: string | null;
    theme?: ThemeConfig;
    avatarUrl?: string | null;
    handle?: string;
    status?: 'draft' | 'published';
  }
): Promise<Profile> {
  const db = getDb();
  const current = (await db`
    SELECT * FROM profiles WHERE id = ${profileId}::uuid LIMIT 1
  `) as unknown as Profile[];

  if (!current[0]) {
    throw new Error('profile_not_found');
  }

  const currentProfile = current[0];
  const hasDisplayName = Object.prototype.hasOwnProperty.call(input, 'displayName');
  const hasBio = Object.prototype.hasOwnProperty.call(input, 'bio');
  const hasAvatarUrl = Object.prototype.hasOwnProperty.call(input, 'avatarUrl');
  const hasTheme = Object.prototype.hasOwnProperty.call(input, 'theme');
  const hasHandle = Object.prototype.hasOwnProperty.call(input, 'handle');
  const hasStatus = Object.prototype.hasOwnProperty.call(input, 'status');

  const displayName = hasDisplayName ? input.displayName ?? currentProfile.display_name : currentProfile.display_name;
  const bio = hasBio ? input.bio ?? null : currentProfile.bio;
  const avatarUrl = hasAvatarUrl ? input.avatarUrl ?? null : currentProfile.avatar_url;
  const theme = JSON.stringify(hasTheme ? normalizeTheme(input.theme) : normalizeTheme(currentProfile.theme));
  const handle = hasHandle ? input.handle ?? currentProfile.handle : currentProfile.handle;
  const status = hasStatus ? input.status ?? currentProfile.status : currentProfile.status;

  const rows = (await db`
    UPDATE profiles
    SET
      display_name = ${displayName},
      bio = ${bio},
      avatar_url = ${avatarUrl},
      theme = ${theme}::jsonb,
      handle = ${handle},
      status = ${status},
      updated_at = NOW()
    WHERE id = ${profileId}::uuid
    RETURNING *
  `) as unknown as Profile[];

  return {
    ...rows[0],
    theme: normalizeTheme(rows[0].theme),
  };
}

export async function listDashboardBlocks(profileId: string): Promise<Block[]> {
  const db = getDb();
  const rows = (await db`
    SELECT *
    FROM blocks
    WHERE profile_id = ${profileId}::uuid
    ORDER BY position ASC, created_at ASC
  `) as unknown as Block[];

  return rows.map(mapBlock);
}

export async function createDashboardBlock(profileId: string, payload: NormalizedBlockPayload): Promise<Block> {
  const db = getDb();
  const nextPositionRows = (await db`
    SELECT COALESCE(MAX(position), -1) + 1 AS next_position
    FROM blocks
    WHERE profile_id = ${profileId}::uuid
  `) as unknown as Array<{ next_position: number }>;
  const position = nextPositionRows[0]?.next_position ?? 0;

  const rows = (await db`
    INSERT INTO blocks (profile_id, type, label, url, config, position, visible_from, visible_until, is_active)
    VALUES (
      ${profileId}::uuid,
      ${payload.type},
      ${payload.label},
      ${payload.url},
      ${JSON.stringify(payload.config)}::jsonb,
      ${position},
      ${payload.visible_from},
      ${payload.visible_until},
      ${payload.is_active}
    )
    RETURNING *
  `) as unknown as Block[];

  return mapBlock(rows[0]);
}

export async function updateDashboardBlock(
  profileId: string,
  blockId: string,
  payload: NormalizedBlockPayload
): Promise<Block | null> {
  const db = getDb();
  const rows = (await db`
    UPDATE blocks
    SET
      type = ${payload.type},
      label = ${payload.label},
      url = ${payload.url},
      config = ${JSON.stringify(payload.config)}::jsonb,
      visible_from = ${payload.visible_from},
      visible_until = ${payload.visible_until},
      is_active = ${payload.is_active}
    WHERE id = ${blockId}::uuid
      AND profile_id = ${profileId}::uuid
    RETURNING *
  `) as unknown as Block[];

  return rows[0] ? mapBlock(rows[0]) : null;
}

export async function deleteDashboardBlock(profileId: string, blockId: string): Promise<boolean> {
  const db = getDb();
  const rows = (await db`
    DELETE FROM blocks
    WHERE id = ${blockId}::uuid
      AND profile_id = ${profileId}::uuid
    RETURNING id
  `) as unknown as Array<{ id: string }>;

  return Boolean(rows[0]);
}

export async function reorderDashboardBlocks(
  profileId: string,
  items: Array<{ id: string; position: number }>
): Promise<Block[]> {
  const db = getDb();
  await db.begin(async (tx) => {
    for (const item of items) {
      await tx`
        UPDATE blocks
        SET position = ${item.position}
        WHERE id = ${item.id}::uuid
          AND profile_id = ${profileId}::uuid
      `;
    }
  });

  return listDashboardBlocks(profileId);
}
