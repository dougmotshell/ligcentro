import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getSession } from '@/adapters/auth';
import { getDashboardProfile, reorderDashboardBlocks } from '@/lib/db/dashboard';

function revalidateProfilePaths(handle: string) {
  revalidatePath(`/pt-BR/${handle}`);
  revalidatePath(`/en-US/${handle}`);
}

export async function PUT(request: Request) {
  const cookieStore = await cookies();
  const session = await getSession(cookieStore);

  if (!session) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const profile = await getDashboardProfile(session);
  if (!profile) {
    return NextResponse.json({ error: 'profile_not_found' }, { status: 404 });
  }

  const body = (await request.json()) as { items?: Array<{ id: string; position: number }> };
  if (!body.items?.length) {
    return NextResponse.json({ error: 'missing_items' }, { status: 400 });
  }

  const blocks = await reorderDashboardBlocks(profile.id, body.items);
  revalidateProfilePaths(profile.handle);

  return NextResponse.json({ blocks });
}
