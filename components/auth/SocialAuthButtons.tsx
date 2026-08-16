import { useTranslations } from 'next-intl';
import { FaGithub, FaGoogle } from 'react-icons/fa';

const PROVIDERS = [
  { id: 'google', Icon: FaGoogle },
  { id: 'github', Icon: FaGithub },
] as const;

interface Props {
  locale: string;
  /**
   * Tela de origem. Muda a copy (entrar vs. cadastrar-se) e volta o erro para a
   * tela certa quando o provedor recusa — o callback lê isto do cookie.
   */
  from: 'login' | 'signup';
}

/**
 * Botões de login social, usados por login e cadastro.
 *
 * O endpoint é o mesmo nos dois casos porque o fluxo OAuth não distingue entrar
 * de cadastrar: o callback chama `ensureDraftProfile`, que cria o perfil quando
 * ainda não existe. O que muda é só a copy — quem está criando conta não deve
 * ler "entrar com Google".
 */
export function SocialAuthButtons({ locale, from }: Props) {
  const t = useTranslations('Auth.social');
  const labelKey = from === 'signup' ? 'signUpWith' : 'continueWith';

  return (
    <>
      <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" aria-hidden="true" />
        <span>{t(from === 'signup' ? 'dividerSignup' : 'dividerLogin')}</span>
        <span className="h-px flex-1 bg-border" aria-hidden="true" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {PROVIDERS.map(({ id, Icon }) => (
          <a
            key={id}
            href={`/api/auth/oauth/${id}?locale=${encodeURIComponent(locale)}&from=${from}`}
            className="flex items-center justify-center gap-2 rounded-xl border border-border px-4 py-3 text-center text-sm font-medium transition hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Icon aria-hidden="true" className="h-4 w-4 shrink-0" />
            {/* Rótulo completo, não só "Google": o divisor que dá o contexto é
                decorativo para quem usa leitor de tela. */}
            <span>{t(labelKey, { provider: t(`providers.${id}`) })}</span>
          </a>
        ))}
      </div>
    </>
  );
}
