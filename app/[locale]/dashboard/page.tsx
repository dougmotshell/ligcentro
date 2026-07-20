import Link from 'next/link';
import { cookies } from 'next/headers';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { redirect } from 'next/navigation';
import { getSession } from '@/adapters/auth';
import { LogoutButton } from './LogoutButton';

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'Auth.dashboard' });
  const cookieStore = await cookies();
  const session = await getSession(cookieStore);

  if (!session) {
    redirect(`/${locale}/login`);
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-12 dark:bg-gray-950">
      <div className="mx-auto flex max-w-3xl flex-col gap-8 rounded-3xl border border-border bg-white p-8 shadow-sm dark:bg-gray-900">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-primary">{t('eyebrow')}</p>
            <h1 className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">
              {t('welcome', { handle: session.handle })}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">{t('description')}</p>
          </div>
          <LogoutButton locale={locale} />
        </div>

        <div className="grid gap-4 rounded-2xl bg-secondary/40 p-6 text-sm text-foreground sm:grid-cols-2">
          <div>
            <p className="text-muted-foreground">{t('accountEmail')}</p>
            <p className="mt-1 font-medium">{session.email}</p>
          </div>
          <div>
            <p className="text-muted-foreground">{t('publicProfile')}</p>
            <Link
              href={`/${locale}/${session.handle}`}
              className="mt-1 inline-flex font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              /{session.handle}
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
