import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { getSession } from '@/adapters/auth';
import { exportProfileData } from '@/lib/db/analytics';

export async function GET() {
  const cookieStore = await cookies();
  const session = await getSession(cookieStore);

  if (!session) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const payload = await exportProfileData(session);
  return NextResponse.json(payload);
}
