import { setRequestLocale } from 'next-intl/server';
import { LoginForm } from './LoginForm';

export default async function LoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  // O código de erro vem por redirecionamento (OAuth, confirmação de e-mail).
  // Lido no servidor para a página não precisar sair da renderização estática.
  const { error } = await searchParams;

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-16 dark:bg-gray-950">
      <LoginForm locale={locale} redirectError={typeof error === 'string' ? error : null} />
    </main>
  );
}
