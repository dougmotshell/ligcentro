import { getDb } from './client';
import type { Block, ProfileWithBlocks } from './types';
import { normalizeTheme } from '@/lib/theme/presets';

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

const demoProfile: ProfileWithBlocks = {
  id: '00000000-0000-0000-0000-000000000001',
  user_id: '00000000-0000-0000-0000-000000000001',
  handle: 'demo',
  display_name: 'Usuário Demo',
  bio: 'Perfil de demonstração do ligcentro. Links, redes sociais e contato em um só lugar.',
  avatar_url: null,
  theme: normalizeTheme({ name: 'default', bg: '#ffffff', btnBg: '#1f2937', btnText: '#ffffff' }),
  status: 'published',
  created_at: new Date(0).toISOString(),
  updated_at: new Date(0).toISOString(),
  blocks: [
    {
      id: '00000000-0000-0000-0000-000000000010',
      profile_id: '00000000-0000-0000-0000-000000000001',
      type: 'link',
      label: 'Meu Site',
      url: 'https://ligcentro.com.br',
      config: {},
      position: 0,
      visible_from: null,
      visible_until: null,
      is_active: true,
      created_at: new Date(0).toISOString(),
    },
    {
      id: '00000000-0000-0000-0000-000000000011',
      profile_id: '00000000-0000-0000-0000-000000000001',
      type: 'social',
      label: 'Instagram',
      url: 'https://instagram.com/ligcentro',
      config: { brand: 'instagram' },
      position: 1,
      visible_from: null,
      visible_until: null,
      is_active: true,
      created_at: new Date(0).toISOString(),
    },
    {
      id: '00000000-0000-0000-0000-000000000012',
      profile_id: '00000000-0000-0000-0000-000000000001',
      type: 'contact',
      label: 'WhatsApp',
      url: 'https://wa.me/5511999999999',
      config: { type: 'whatsapp', value: '5511999999999' },
      position: 2,
      visible_from: null,
      visible_until: null,
      is_active: true,
      created_at: new Date(0).toISOString(),
    },
  ],
};

export async function getProfileByHandle(handle: string): Promise<ProfileWithBlocks | null> {
  const db = getDb();
  const profiles = (await db`
    SELECT
      p.*,
      COALESCE(
        json_agg(b ORDER BY b.position) FILTER (
          WHERE b.id IS NOT NULL
            AND b.is_active = true
            AND (b.visible_from IS NULL OR b.visible_from <= NOW())
            AND (b.visible_until IS NULL OR b.visible_until >= NOW())
        ),
        '[]'::json
      ) AS blocks
    FROM profiles p
    LEFT JOIN blocks b ON b.profile_id = p.id
    WHERE p.handle = ${handle}
      AND p.status = 'published'
    GROUP BY p.id
    LIMIT 1
  `) as unknown as ProfileWithBlocks[];

  if (!profiles[0]) {
    return null;
  }

  return {
    ...profiles[0],
    theme: normalizeTheme(profiles[0].theme),
    blocks: (profiles[0].blocks ?? []).map(mapBlock),
  };
}

export async function getPublishedHandles(): Promise<string[]> {
  const db = getDb();
  const rows = (await db`
    SELECT handle
    FROM profiles
    WHERE status = 'published'
    ORDER BY handle
  `) as unknown as Array<{ handle: string }>;

  return rows.map((row) => row.handle);
}

export function getFallbackProfileByHandle(handle: string): ProfileWithBlocks | null {
  return handle === demoProfile.handle ? demoProfile : null;
}
