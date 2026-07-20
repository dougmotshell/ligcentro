import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

export default async function HandleNotFound() {
  const t = await getTranslations('NotFound');

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-gray-900">
      <div className="text-center">
        <h1 className="mb-4 text-6xl font-bold text-gray-900 dark:text-white">404</h1>
        <p className="mb-8 text-xl text-gray-600 dark:text-gray-400">{t('profileNotFound')}</p>
        <Link
          href="/"
          className="inline-block rounded-xl bg-indigo-600 px-6 py-3 font-medium text-white transition-colors hover:bg-indigo-700"
        >
          {t('backHome')}
        </Link>
      </div>
    </main>
  );
}
