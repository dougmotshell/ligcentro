'use client';

import { useTranslations } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

/**
 * Página raiz do ligcentro.
 * Exibe "Hello, ligcentro" no idioma do visitante (pt-BR / en-US).
 * Inclui seletor de idioma e toggle de tema claro/escuro.
 */
export default function HomePage() {
  const t = useTranslations('HomePage');
  const router = useRouter();
  const pathname = usePathname();
  const [isDark, setIsDark] = useState(false);

  // Inicializa estado do tema a partir do DOM (já aplicado pelo script no layout)
  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'));
  }, []);

  // Alterna tema claro/escuro e persiste a preferência
  const toggleTheme = useCallback(() => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle('dark', next);
    try {
      localStorage.setItem('ligcentro-theme', next ? 'dark' : 'light');
    } catch (_) {}
  }, [isDark]);

  // Troca o locale mantendo o caminho atual
  const switchLocale = useCallback(
    (locale: string) => {
      // Substitui o segmento de locale no início do pathname
      const segments = pathname.split('/');
      segments[1] = locale;
      router.push(segments.join('/') || '/');
    },
    [pathname, router]
  );

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-8 p-8 bg-background text-foreground">
      {/* Cabeçalho principal */}
      <section className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-primary">{t('hello')}</h1>
        <p className="mt-3 text-muted-foreground">{t('tagline')}</p>
      </section>

      {/* Controles de tema e idioma */}
      <div className="flex gap-4 flex-wrap justify-center">
        {/* Toggle tema */}
        <button
          onClick={toggleTheme}
          className="px-4 py-2 rounded border border-border bg-secondary text-secondary-foreground hover:opacity-80 transition-opacity text-sm font-medium"
          aria-label={t('toggleTheme')}
        >
          {isDark ? '☀️ ' + t('lightMode') : '🌙 ' + t('darkMode')}
        </button>

        {/* Seletor de idioma */}
        <button
          onClick={() => switchLocale('pt-BR')}
          className="px-4 py-2 rounded border border-border bg-secondary text-secondary-foreground hover:opacity-80 transition-opacity text-sm font-medium"
        >
          🇧🇷 PT
        </button>
        <button
          onClick={() => switchLocale('en-US')}
          className="px-4 py-2 rounded border border-border bg-secondary text-secondary-foreground hover:opacity-80 transition-opacity text-sm font-medium"
        >
          🇺🇸 EN
        </button>
      </div>

      {/* Fase atual */}
      <p className="text-xs text-muted-foreground">{t('phase')}</p>
    </main>
  );
}
