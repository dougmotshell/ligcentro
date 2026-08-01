import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { resolveSession } from '@/lib/auth/session';
import { getDashboardProfile, reorderDashboardBlocks } from '@/lib/db/dashboard';

function revalidateProfilePaths(handle: string) {
  revalidatePath(`/pt-BR/${handle}`);
  revalidatePath(`/en-US/${handle}`);
}

export async function PUT(request: Request) {
  const session = await resolveSession();

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

  const blocks = await reorderDashboardBlocks(session.id, profile.id, body.items);
  revalidateProfilePaths(profile.handle);

  return NextResponse.json({ blocks });
}
