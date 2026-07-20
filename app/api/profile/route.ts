import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getSession } from '@/adapters/auth';
import { getDashboardProfile, updateDashboardProfile } from '@/lib/db/dashboard';
import { normalizeTheme } from '@/lib/theme/presets';

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

  return NextResponse.json({ profile });
}

export async function PUT(request: Request) {
  const cookieStore = await cookies();
  const session = await getSession(cookieStore);

  if (!session) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const currentProfile = await getDashboardProfile(session);

  if (!currentProfile) {
    return NextResponse.json({ error: 'profile_not_found' }, { status: 404 });
  }

  const body = (await request.json()) as {
    displayName?: string;
    bio?: string | null;
    theme?: { name?: string; bg?: string; btnBg?: string; btnText?: string };
  };

  const profile = await updateDashboardProfile(currentProfile.id, {
    ...(body.displayName !== undefined ? { displayName: body.displayName.trim() || currentProfile.display_name } : {}),
    ...(body.bio !== undefined ? { bio: body.bio?.trim() || null } : {}),
    ...(body.theme ? { theme: normalizeTheme(body.theme) } : {}),
  });

  revalidateProfilePaths(profile.handle);

  return NextResponse.json({ profile });
}
