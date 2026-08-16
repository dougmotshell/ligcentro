import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { exchangeCodeForSession } from '@/adapters/auth/supabase';
import { applySessionCookies } from '@/lib/auth/session';
import { clearedCookieOptions } from '@/lib/auth/cookies';
import { ensureDraftProfile } from '@/lib/db/provisioning';

const OAUTH_COOKIES = [
  'oauth-code-verifier',
  'oauth-state',
  'oauth-locale',
  'oauth-origin',
] as const;

/**
 * Registra a causa real da falha no log do servidor.
 *
 * Antes, um `catch {}` mudo transformava qualquer falha em `?error=oauth_failed`:
 * o banco de produção estava sem as tabelas e a mensagem na tela — e nos logs da
 * Vercel — dizia apenas que o "login social falhou" (TCK-0025). Erro que não diz
 * a causa custa um ciclo inteiro de investigação. Só a mensagem é registrada:
 * `code`, verifier e tokens ficam de fora de propósito.
 */
function logOAuthFailure(stage: string, error: unknown): void {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[oauth-callback] falha em ${stage}: ${message}`);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const cookieStore = await cookies();
  const locale = cookieStore.get('oauth-locale')?.value === 'en-US' ? 'en-US' : 'pt-BR';
  // A tela de origem: quem começou o fluxo em /signup volta para /signup, não
  // para /login — o erro precisa aparecer onde a pessoa estava (TCK-0020).
  const origin = cookieStore.get('oauth-origin')?.value === 'signup' ? 'signup' : 'login';
  const state = cookieStore.get('oauth-state')?.value;
  const verifier = cookieStore.get('oauth-code-verifier')?.value;
  const code = url.searchParams.get('code');
  const returnedState = url.searchParams.get('oauth_state');

  const failure = (reason: string) =>
    NextResponse.redirect(new URL(`/${locale}/${origin}?error=${reason}`, url.origin));

  if (!code || !state || !verifier || state !== returnedState) {
    // O provedor também devolve o motivo quando recusa antes de emitir o código.
    const providerError =
      url.searchParams.get('error_description') ?? url.searchParams.get('error');
    logOAuthFailure(
      'validação do retorno',
      providerError ??
        `code=${code ? 'presente' : 'ausente'} state=${state ? 'presente' : 'ausente'} verifier=${verifier ? 'presente' : 'ausente'} state_confere=${state === returnedState}`
    );
    return failure('oauth_state');
  }

  let session;
  try {
    session = await exchangeCodeForSession(code, verifier);
  } catch (error) {
    logOAuthFailure('troca do código por sessão', error);
    return failure('oauth_failed');
  }

  try {
    const profile = await ensureDraftProfile(session);
    session.profileId = profile.id;
    session.handle = profile.handle;
  } catch (error) {
    // Falha aqui é de infraestrutura (schema ausente, banco fora do ar), não do
    // provedor — dizer "o login social falhou" mandaria a pessoa tentar de novo
    // para sempre.
    logOAuthFailure('provisionamento do perfil', error);
    return failure('oauth_profile_failed');
  }

  const response = NextResponse.redirect(new URL(`/${locale}/onboarding?step=1`, url.origin));
  applySessionCookies(response, session);
  for (const name of OAUTH_COOKIES) {
    response.cookies.set({ name, value: '', ...clearedCookieOptions() });
  }
  return response;
}
