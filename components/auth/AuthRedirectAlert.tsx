import { useTranslations } from 'next-intl';
import { isRedirectError } from '@/lib/auth/redirect-errors';

interface Props {
  /** Valor cru de `?error=`; qualquer coisa fora da lista conhecida é ignorada. */
  error?: string | null;
}

/** Aviso de falha vinda por redirecionamento (OAuth, confirmação de e-mail). */
export function AuthRedirectAlert({ error }: Props) {
  const t = useTranslations('Auth');

  if (!isRedirectError(error)) {
    return null;
  }

  return (
    <p
      role="alert"
      className="mb-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-200"
    >
      {t(`errors.${error}`)}
    </p>
  );
}
