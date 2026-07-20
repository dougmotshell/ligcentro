import { setRequestLocale } from 'next-intl/server';
import { SignupForm } from './SignupForm';

export default async function SignupPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-16 dark:bg-gray-950">
      <SignupForm locale={locale} />
    </main>
  );
}
