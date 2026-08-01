import { NextResponse } from 'next/server';
import { recordProfileView } from '@/lib/db/analytics';
import { getAnalyticsRateLimiter } from '@/lib/analytics/rate-limit';
import { isUuid } from '@/lib/uuid';

function getReferrerHost(request: Request): string | null {
  const referrer = request.headers.get('referer');
  if (!referrer) {
    return null;
  }

  try {
    return new URL(referrer).host;
  } catch {
    return null;
  }
}

async function parseBody(request: Request): Promise<{ profileId?: string }> {
  const text = await request.text();
  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text) as { profileId?: string };
  } catch {
    return {};
  }
}

export async function POST(request: Request) {
  const body = await parseBody(request);

  if (!isUuid(body.profileId)) {
    return NextResponse.json({ error: 'missing_profile_id' }, { status: 400 });
  }

  // Teto por perfil, sem identificar visitante (regra 7 do AGENTS.md).
  if (!getAnalyticsRateLimiter().check(`view:${body.profileId}`).allowed) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 });
  }

  const country =
    request.headers.get('x-vercel-ip-country') ?? request.headers.get('x-country') ?? null;
  const referrerHost = getReferrerHost(request);

  // A função no banco recusa perfil inexistente ou não publicado.
  const recorded = await recordProfileView(body.profileId, country, referrerHost);

  if (!recorded) {
    return NextResponse.json({ error: 'profile_not_eligible' }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
