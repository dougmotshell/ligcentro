import { setRequestLocale } from 'next-intl/server';
import { LoginForm } from './LoginForm';

export default async function LoginPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-16 dark:bg-gray-950">
      <LoginForm locale={locale} />
    </main>
  );
}
