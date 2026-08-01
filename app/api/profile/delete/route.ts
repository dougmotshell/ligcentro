import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { isMockAuthActive, signOut } from '@/adapters/auth';
import { deleteAuthUser } from '@/adapters/auth/supabase';
import { clearSessionCookies, resolveSession } from '@/lib/auth/session';
import { deleteAccountData } from '@/lib/db/account';
import { getDashboardProfile } from '@/lib/db/dashboard';

/**
 * Exclusão de conta — direito de eliminação da LGPD, contrapartida da exportação
 * que já existia.
 *
 * Exige o handle no corpo como confirmação: a ação é irreversível, e digitar o
 * próprio handle deixa explícito o que está sendo apagado. Não é dark pattern —
 * um passo, texto claro, nenhuma tentativa de dissuadir.
 */
export async function POST(request: Request) {
  const session = await resolveSession();

  if (!session) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const profile = await getDashboardProfile(session);

  if (!profile) {
    return NextResponse.json({ error: 'profile_not_found' }, { status: 404 });
  }

  const body = (await request.json().catch(() => ({}))) as { confirmHandle?: string };

  if (body.confirmHandle?.trim().toLowerCase() !== profile.handle.toLowerCase()) {
    return NextResponse.json({ error: 'confirmation_mismatch' }, { status: 400 });
  }

  const freedHandle = await deleteAccountData(session.id);

  // O usuário do provedor só sai com credencial de administração. Sem ela, os
  // dados de produto já foram apagados e a pendência fica registrada — melhor
  // que abortar a exclusão inteira por falta de uma variável de ambiente.
  let authUserRemoved = true;
  if (!isMockAuthActive()) {
    authUserRemoved = await deleteAuthUser(session.id);

    if (!authUserRemoved) {
      console.error(
        `[exclusão de conta] dados apagados, mas o usuário ${session.id} permanece no provedor de auth: falta SUPABASE_SERVICE_ROLE_KEY ou a chamada falhou.`
      );
    }
  }

  await signOut(session.accessToken);

  if (freedHandle) {
    revalidatePath(`/pt-BR/${freedHandle}`);
    revalidatePath(`/en-US/${freedHandle}`);
  }

  const response = NextResponse.json({ deleted: true, authUserRemoved, freedHandle });
  clearSessionCookies(response);

  return response;
}
