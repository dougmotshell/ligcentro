import { NextResponse } from 'next/server';
import { recordBlockClick } from '@/lib/db/analytics';
import { getAnalyticsRateLimiter } from '@/lib/analytics/rate-limit';
import { isUuid } from '@/lib/uuid';

async function parseBody(request: Request): Promise<{ blockId?: string; profileId?: string }> {
  const text = await request.text();
  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text) as { blockId?: string; profileId?: string };
  } catch {
    return {};
  }
}

export async function POST(request: Request) {
  const body = await parseBody(request);

  if (!isUuid(body.blockId) || !isUuid(body.profileId)) {
    return NextResponse.json({ error: 'missing_fields' }, { status: 400 });
  }

  if (!getAnalyticsRateLimiter().check(`click:${body.blockId}`).allowed) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 });
  }

  // A função no banco exige que o bloco pertença ao perfil e que o perfil esteja
  // publicado — é o que impede inflar a métrica de um bloco de outra pessoa.
  const recorded = await recordBlockClick(body.blockId, body.profileId);

  if (!recorded) {
    return NextResponse.json({ error: 'block_not_eligible' }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
