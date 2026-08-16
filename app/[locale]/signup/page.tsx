import { setRequestLocale } from 'next-intl/server';
import { SignupForm } from './SignupForm';

export default async function SignupPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  // O cadastro também inicia login social, então recebe os erros de
  // redirecionamento do callback OAuth — lidos no servidor, como no login.
  const { error } = await searchParams;

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-16 dark:bg-gray-950">
      <SignupForm locale={locale} redirectError={typeof error === 'string' ? error : null} />
    </main>
  );
}
