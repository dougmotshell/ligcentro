'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

export default function HomePage() {
  const t = useTranslations('HomePage');
  const router = useRouter();
  const pathname = usePathname();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'));
  }, []);

  const toggleTheme = useCallback(() => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle('dark', next);
    try {
      localStorage.setItem('ligcentro-theme', next ? 'dark' : 'light');
    } catch {}
  }, [isDark]);

  const switchLocale = useCallback(
    (locale: string) => {
      const segments = pathname.split('/');
      segments[1] = locale;
      router.push(segments.join('/') || '/');
    },
    [pathname, router]
  );

  const featureKeys = ['speed', 'editor', 'analytics'] as const;

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="border-b border-border bg-gradient-to-b from-background via-background to-secondary/40">
        <div className="mx-auto flex max-w-6xl flex-col gap-10 px-6 py-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <span className="text-lg font-semibold text-primary">ligcentro</span>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => switchLocale('pt-BR')}
                className="rounded-xl border border-border px-4 py-2 text-sm font-medium transition hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring"
              >
                🇧🇷 PT
              </button>
              <button
                type="button"
                onClick={() => switchLocale('en-US')}
                className="rounded-xl border border-border px-4 py-2 text-sm font-medium transition hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring"
              >
                🇺🇸 EN
              </button>
              <button
                type="button"
                onClick={toggleTheme}
                className="rounded-xl border border-border px-4 py-2 text-sm font-medium transition hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring"
                aria-label={t('toggleTheme')}
              >
                {isDark ? t('lightMode') : t('darkMode')}
              </button>
            </div>
          </div>

          <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary">ligcentro</p>
              <h1 className="mt-4 max-w-3xl text-4xl font-bold tracking-tight text-gray-900 dark:text-white md:text-6xl">
                {t('hero.headline')}
              </h1>
              <p className="mt-5 max-w-2xl text-lg text-muted-foreground">{t('hero.subtitle')}</p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  href={`${pathname}/signup`.replace('//', '/')}
                  className="rounded-2xl bg-primary px-6 py-4 text-sm font-semibold text-primary-foreground transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {t('hero.cta')}
                </Link>
                <Link
                  href={`${pathname}/demo`.replace('//', '/')}
                  className="rounded-2xl border border-border px-6 py-4 text-sm font-semibold transition hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {t('demo.cta')}
                </Link>
              </div>
            </div>

            <div className="rounded-[2rem] border border-border bg-white p-6 shadow-xl dark:bg-gray-900">
              <div className="rounded-[1.5rem] bg-[#f5f3ff] p-6">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#7c3aed] text-2xl font-bold text-white">
                  d
                </div>
                <p className="mt-4 text-center text-lg font-semibold text-gray-900">@demo</p>
                <p className="mt-2 text-center text-sm text-gray-600">{t('demo.title')}</p>
                <div className="mt-5 space-y-3">
                  {[1, 2, 3].map((item) => (
                    <div key={item} className="rounded-xl bg-[#7c3aed] px-4 py-3 text-center text-sm font-medium text-white">
                      ligcentro link {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-semibold text-gray-900 dark:text-white">{t('features.title')}</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {featureKeys.map((featureKey) => (
            <article key={featureKey} className="rounded-3xl border border-border bg-white p-6 shadow-sm dark:bg-gray-900">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t(`features.items.${featureKey}.title`)}
              </h3>
              <p className="mt-3 text-sm text-muted-foreground">{t(`features.items.${featureKey}.desc`)}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-secondary/40">
        <div className="mx-auto max-w-6xl px-6 py-16 text-center">
          <h2 className="text-3xl font-semibold text-gray-900 dark:text-white">{t('demo.title')}</h2>
          <p className="mt-4 text-muted-foreground">{t('demo.subtitle')}</p>
          <Link
            href={`${pathname}/demo`.replace('//', '/')}
            className="mt-8 inline-flex rounded-2xl bg-primary px-6 py-4 text-sm font-semibold text-primary-foreground transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {t('demo.cta')}
          </Link>
        </div>
      </section>

      <footer className="mx-auto max-w-6xl px-6 py-10 text-center text-sm text-muted-foreground">
        {t('footer.copyright', { year: new Date().getFullYear() })}
      </footer>
    </main>
  );
}
