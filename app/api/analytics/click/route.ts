import { NextResponse } from 'next/server';
import { recordBlockClick } from '@/lib/db/analytics';

async function parseBody(request: Request): Promise<{ blockId?: string; profileId?: string }> {
  const text = await request.text();
  if (!text) {
    return {};
  }

  return JSON.parse(text) as { blockId?: string; profileId?: string };
}

export async function POST(request: Request) {
  const body = await parseBody(request);
  if (!body.blockId || !body.profileId) {
    return NextResponse.json({ error: 'missing_fields' }, { status: 400 });
  }

  await recordBlockClick(body.blockId, body.profileId);

  return NextResponse.json({ ok: true });
}
