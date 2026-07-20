import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db/client';
import { normalizeHandle, validateHandle } from '@/lib/handle/validate';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const handleParam = searchParams.get('handle') ?? '';
  const handle = normalizeHandle(handleParam);
  const validation = validateHandle(handle);

  if (!validation.valid) {
    return NextResponse.json({ available: false });
  }

  const db = getDb();
  const rows = await db<{ exists: boolean }[]>`
    SELECT EXISTS(
      SELECT 1 FROM profiles WHERE handle = ${handle}
    ) AS exists
  `;

  return NextResponse.json({ available: !rows[0]?.exists });
}
