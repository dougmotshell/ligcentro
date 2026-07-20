import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getMockSessionCookieValue, getSession } from '@/adapters/auth';
import { getDashboardProfile, isHandleAvailable, updateDashboardProfile } from '@/lib/db/dashboard';
import { normalizeTheme } from '@/lib/theme/presets';
import { normalizeHandle, validateHandle } from '@/lib/handle/validate';

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
    handle?: string;
    status?: 'draft' | 'published';
  };

  let nextHandle = currentProfile.handle;
  if (body.handle !== undefined) {
    nextHandle = normalizeHandle(body.handle);
    const validation = validateHandle(nextHandle);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error ?? 'invalid_handle' }, { status: 400 });
    }

    const available = await isHandleAvailable(nextHandle, currentProfile.id);
    if (!available) {
      return NextResponse.json({ error: 'handle_taken' }, { status: 409 });
    }
  }

  const profile = await updateDashboardProfile(currentProfile.id, {
    ...(body.displayName !== undefined ? { displayName: body.displayName.trim() || currentProfile.display_name } : {}),
    ...(body.bio !== undefined ? { bio: body.bio?.trim() || null } : {}),
    ...(body.theme ? { theme: normalizeTheme(body.theme) } : {}),
    ...(body.handle !== undefined ? { handle: nextHandle } : {}),
    ...(body.status ? { status: body.status } : {}),
  });

  revalidateProfilePaths(currentProfile.handle);
  revalidateProfilePaths(profile.handle);

  const response = NextResponse.json({ profile });
  if (body.handle !== undefined) {
    response.cookies.set({
      name: 'mock-auth',
      value: getMockSessionCookieValue({
        id: session.id,
        email: session.email,
        handle: profile.handle,
        profileId: profile.id,
      }),
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });
  }

  return response;
}
