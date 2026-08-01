import { NextResponse } from 'next/server';
import { isSupabaseAuthConfigured } from '@/adapters/auth';
import { EMAIL_VERIFY_TYPES, verifyEmailToken, type EmailVerifyType } from '@/adapters/auth/supabase';
import { applySessionCookies } from '@/lib/auth/session';
import { ensureDraftProfile } from '@/lib/db/provisioning';
import { routing } from '@/i18n/routing';

function resolveLocale(value: string | null): string {
  return routing.locales.includes(value as (typeof routing.locales)[number]) ? (value as string) : routing.defaultLocale;
}

function isVerifyType(value: string | null): value is EmailVerifyType {
  return EMAIL_VERIFY_TYPES.includes(value as EmailVerifyType);
}

/**
 * Callback do link de confirmação de e-mail do Supabase.
 *
 * O cadastro cria o perfil `draft` na hora; é aqui que a sessão nasce, depois de
 * o titular provar que o e-mail é dele. Configurar esta URL como
 * "Redirect URL" no Supabase Auth.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const locale = resolveLocale(url.searchParams.get('locale'));

  if (!isSupabaseAuthConfigured()) {
    return NextResponse.redirect(new URL(`/${locale}/login?error=auth_not_configured`, url.origin));
  }

  const tokenHash = url.searchParams.get('token_hash');
  const type = url.searchParams.get('type');

  if (!tokenHash || !isVerifyType(type)) {
    return NextResponse.redirect(new URL(`/${locale}/login?error=confirm_invalid`, url.origin));
  }

  try {
    const session = await verifyEmailToken(tokenHash, type);
    // Quem chega aqui sem perfil (conta criada fora do formulário de cadastro)
    // recebe um perfil `draft` e escolhe o handle no onboarding — mandar para o
    // cadastro seria beco sem saída, porque o usuário do provedor já existe.
    const profile = await ensureDraftProfile(session);
    session.profileId = profile.id;
    session.handle = profile.handle;

    const response = NextResponse.redirect(new URL(`/${locale}/onboarding?step=1`, url.origin));
    applySessionCookies(response, session);

    return response;
  } catch {
    return NextResponse.redirect(new URL(`/${locale}/login?error=confirm_failed`, url.origin));
  }
}
