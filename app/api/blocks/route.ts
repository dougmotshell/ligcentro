import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getSession } from '@/adapters/auth';
import { normalizeBlockInput, type BlockPayloadInput } from '@/lib/blocks/normalize';
import { createDashboardBlock, getDashboardProfile, listDashboardBlocks } from '@/lib/db/dashboard';

function revalidateProfilePaths(handle: string) {
  revalidatePath(`/pt-BR/${handle}`);
  revalidatePath(`/en-US/${handle}`);
}

export async function GET() {
  const cookieStore = await cookies();
  const session = await getSession(cookieStore);

  if (!session) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const profile = await getDashboardProfile(session);

  if (!profile) {
    return NextResponse.json({ error: 'profile_not_found' }, { status: 404 });
  }

  const blocks = await listDashboardBlocks(profile.id);
  return NextResponse.json({ blocks });
}

export async function POST(request: Request) {
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
    const body = (await request.json()) as BlockPayloadInput;
    const payload = normalizeBlockInput(body);
    const block = await createDashboardBlock(profile.id, payload);
    revalidateProfilePaths(profile.handle);
    return NextResponse.json({ block }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'invalid_payload' },
      { status: 400 }
    );
  }
}
