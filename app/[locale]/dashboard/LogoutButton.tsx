'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

interface Props {
  locale: string;
}

export function LogoutButton({ locale }: Props) {
  const t = useTranslations('Auth.dashboard');
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        router.push(`/${locale}/login`);
        router.refresh();
      }}
      className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring"
    >
      {t('signOut')}
    </button>
  );
}
