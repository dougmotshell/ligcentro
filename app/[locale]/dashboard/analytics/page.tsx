import { cookies } from 'next/headers';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { redirect } from 'next/navigation';
import { getSession } from '@/adapters/auth';
import { getDashboardProfile } from '@/lib/db/dashboard';
import { getAnalyticsOverview } from '@/lib/db/analytics';

export default async function DashboardAnalyticsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'AnalyticsPage' });
  const cookieStore = await cookies();
  const session = await getSession(cookieStore);

  if (!session) {
    redirect(`/${locale}/login`);
  }

  const profile = await getDashboardProfile(session);
  if (!profile) {
    redirect(`/${locale}/dashboard`);
  }

  const analytics = await getAnalyticsOverview(profile.id);
  const maxViews = Math.max(...analytics.series.map((item) => item.views), 1);

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-12 dark:bg-gray-950">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="rounded-3xl border border-border bg-white p-8 shadow-sm dark:bg-gray-900">
          <p className="text-sm font-medium text-primary">{t('eyebrow')}</p>
          <h1 className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">{t('title')}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t('description', { handle: profile.handle })}</p>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <article className="rounded-3xl border border-border bg-white p-6 shadow-sm dark:bg-gray-900">
            <p className="text-sm text-muted-foreground">{t('cards.views')}</p>
            <p className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">{analytics.totalViews}</p>
          </article>
          <article className="rounded-3xl border border-border bg-white p-6 shadow-sm dark:bg-gray-900">
            <p className="text-sm text-muted-foreground">{t('cards.clicks')}</p>
            <p className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">{analytics.totalClicks}</p>
          </article>
          <article className="rounded-3xl border border-border bg-white p-6 shadow-sm dark:bg-gray-900">
            <p className="text-sm text-muted-foreground">{t('cards.ctr')}</p>
            <p className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">
              {(analytics.ctr * 100).toFixed(1)}%
            </p>
          </article>
        </section>

        <section className="rounded-3xl border border-border bg-white p-8 shadow-sm dark:bg-gray-900">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{t('chart.title')}</h2>
              <p className="text-sm text-muted-foreground">{t('chart.description')}</p>
            </div>
          </div>
          <div className="grid grid-cols-5 gap-3 md:grid-cols-10 lg:grid-cols-15 xl:grid-cols-30">
            {analytics.series.map((item) => (
              <div key={item.day} className="flex flex-col items-center gap-2">
                <div className="flex h-36 w-full items-end rounded-2xl bg-gray-100 p-2 dark:bg-gray-800">
                  <div
                    className="w-full rounded-xl bg-primary"
                    style={{ height: `${Math.max((item.views / maxViews) * 100, item.views > 0 ? 10 : 0)}%` }}
                    title={`${item.day}: ${item.views}`}
                    aria-label={t('chart.barAriaLabel', { day: item.day, count: item.views })}
                  />
                </div>
                <span className="text-[11px] text-muted-foreground">{item.day.slice(5)}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-border bg-white p-8 shadow-sm dark:bg-gray-900">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{t('topBlocks.title')}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{t('topBlocks.description')}</p>
          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead>
                <tr className="text-left text-sm text-muted-foreground">
                  <th className="pb-3 pr-4">{t('table.block')}</th>
                  <th className="pb-3 pr-4">{t('table.type')}</th>
                  <th className="pb-3">{t('table.clicks')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-sm text-gray-900 dark:text-white">
                {analytics.topBlocks.map((block) => (
                  <tr key={block.id}>
                    <td className="py-3 pr-4">{block.label ?? t('table.untitled')}</td>
                    <td className="py-3 pr-4">{t(`table.types.${block.type}`)}</td>
                    <td className="py-3">{block.clicks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
