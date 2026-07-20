import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'),
  title: 'ligcentro',
  description: 'Seu link-in-bio. Simples, rápido e seu.',
};

/**
 * Layout raiz — exigido pelo Next.js App Router.
 * Define <html> e <body>; o layout de locale ([locale]/layout.tsx)
 * adiciona o provider de i18n e o atributo lang correto.
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html suppressHydrationWarning>
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
