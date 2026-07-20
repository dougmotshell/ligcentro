import { NextResponse } from 'next/server';
import { recordProfileView } from '@/lib/db/analytics';

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

  return JSON.parse(text) as { profileId?: string };
}

export async function POST(request: Request) {
  const body = await parseBody(request);
  if (!body.profileId) {
    return NextResponse.json({ error: 'missing_profile_id' }, { status: 400 });
  }

  const country = request.headers.get('x-vercel-ip-country') ?? request.headers.get('x-country') ?? null;
  const referrerHost = getReferrerHost(request);

  await recordProfileView(body.profileId, country, referrerHost);

  return NextResponse.json({ ok: true });
}
