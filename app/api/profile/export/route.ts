import { NextResponse } from 'next/server';
import { resolveSession } from '@/lib/auth/session';
import { exportProfileData } from '@/lib/db/analytics';

export async function GET() {
  const session = await resolveSession();

  if (!session) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const payload = await exportProfileData(session);
  return NextResponse.json(payload);
}
