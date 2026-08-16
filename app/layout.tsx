import type { Metadata } from 'next';
import { getLocale } from 'next-intl/server';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'),
  title: 'ligcentro',
  description: 'Seu link-in-bio. Simples, rápido e seu.',
};

/**
 * Layout raiz — exigido pelo Next.js App Router. Define <html> e <body>; o
 * layout de locale ([locale]/layout.tsx) adiciona o provider de i18n.
 *
 * O `lang` sai daqui porque só este componente renderiza o <html>: o layout de
 * locale afirmava defini-lo, mas nunca emitiu a tag, e o site inteiro era
 * servido sem `lang` — falha WCAG 3.1.1 nível A, encontrada pelo axe no
 * TCK-0021. Sem `lang`, o leitor de tela pronuncia português com fonemas do
 * idioma padrão do sistema.
 */
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();

  return (
    <html lang={locale} suppressHydrationWarning>
      {/*
       * Script inline: lê preferência salva (localStorage) e aplica a classe
       * "dark" ANTES da primeira pintura para evitar flash de tema errado.
       */}
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function () {
                try {
                  var theme = localStorage.getItem('ligcentro-theme');
                  if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                    document.documentElement.classList.add('dark');
                  }
                } catch (_) {}
              })();
            `,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
