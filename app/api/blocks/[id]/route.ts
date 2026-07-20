import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getSession } from '@/adapters/auth';
import { normalizeBlockInput, type BlockPayloadInput } from '@/lib/blocks/normalize';
import {
  deleteDashboardBlock,
  getDashboardProfile,
  updateDashboardBlock,
} from '@/lib/db/dashboard';

function revalidateProfilePaths(handle: string) {
  revalidatePath(`/pt-BR/${handle}`);
  revalidatePath(`/en-US/${handle}`);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const cookieStore = await cookies();
  const session = await getSession(cookieStore);

  if (!session) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const profile = await getDashboardProfile(session);
  if (!profile) {
    return NextResponse.json({ error: 'profile_not_found' }, { status: 404 });
  }

  try {
    const { id } = await params;
    const body = (await request.json()) as BlockPayloadInput;
    const payload = normalizeBlockInput(body);
    const block = await updateDashboardBlock(profile.id, id, payload);

    if (!block) {
      return NextResponse.json({ error: 'block_not_found' }, { status: 404 });
    }

    revalidateProfilePaths(profile.handle);

    return NextResponse.json({ block });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'invalid_payload' },
      { status: 400 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const cookieStore = await cookies();
  const session = await getSession(cookieStore);

  if (!session) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const profile = await getDashboardProfile(session);
  if (!profile) {
    return NextResponse.json({ error: 'profile_not_found' }, { status: 404 });
  }

  const { id } = await params;
  const deleted = await deleteDashboardBlock(profile.id, id);

  if (!deleted) {
    return NextResponse.json({ error: 'block_not_found' }, { status: 404 });
  }

  revalidateProfilePaths(profile.handle);

  return NextResponse.json({ ok: true });
}
