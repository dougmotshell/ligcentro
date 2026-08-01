import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { resolveSession } from '@/lib/auth/session';
import { createStorageAdapter } from '@/adapters/storage';
import { getDashboardProfile, updateDashboardProfile } from '@/lib/db/dashboard';
import { MAX_AVATAR_SIZE_IN_BYTES, validateAvatarFile } from '@/lib/storage/validate';

function revalidateProfilePaths(handle: string) {
  revalidatePath(`/pt-BR/${handle}`);
  revalidatePath(`/en-US/${handle}`);
}

export async function POST(request: Request) {
  const session = await resolveSession();

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

  // Valida antes de chamar o storage para o usuário receber o motivo exato, e
  // para arquivo grande demais nem virar requisição de rede.
  const validation = validateAvatarFile(file);

  if (!validation.valid) {
    return NextResponse.json(
      { error: validation.error, maxSizeInBytes: MAX_AVATAR_SIZE_IN_BYTES },
      { status: 400 }
    );
  }

  const storage = createStorageAdapter();
  let saved: { url: string };
  try {
    saved = await storage.saveFile(session.id, file);
  } catch (error) {
    // Falha de configuração ou do provedor: erro tratado, não 500 anônimo.
    const reason = error instanceof Error ? error.message.split(':')[0] : 'storage_failed';
    console.error('[avatar] falha ao gravar arquivo:', error);

    return NextResponse.json({ error: reason || 'storage_failed' }, { status: 502 });
  }

  const previousAvatarUrl = profile.avatar_url;
  const updatedProfile = await updateDashboardProfile(session.id, profile.id, {
    avatarUrl: saved.url,
  });

  // Só depois de a nova URL estar gravada: se a limpeza falhar, sobra um arquivo
  // órfão — perder o avatar recém-enviado seria pior.
  if (previousAvatarUrl && previousAvatarUrl !== saved.url) {
    await storage.deleteFileByUrl(previousAvatarUrl).catch((error) => {
      console.error('[avatar] falha ao remover o avatar anterior:', error);
    });
  }

  revalidateProfilePaths(updatedProfile.handle);

  return NextResponse.json({ profile: updatedProfile });
}
