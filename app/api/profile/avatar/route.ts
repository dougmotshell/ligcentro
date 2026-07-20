import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getSession } from '@/adapters/auth';
import { createStorageAdapter } from '@/adapters/storage';
import { getDashboardProfile, updateDashboardProfile } from '@/lib/db/dashboard';

function revalidateProfilePaths(handle: string) {
  revalidatePath(`/pt-BR/${handle}`);
  revalidatePath(`/en-US/${handle}`);
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

  const formData = await request.formData();
  const file = formData.get('file');

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'missing_file' }, { status: 400 });
  }

  const storage = createStorageAdapter();
  const saved = await storage.saveFile(session.id, file);
  const updatedProfile = await updateDashboardProfile(profile.id, {
    avatarUrl: saved.url,
  });

  revalidateProfilePaths(updatedProfile.handle);

  return NextResponse.json({ profile: updatedProfile });
}
