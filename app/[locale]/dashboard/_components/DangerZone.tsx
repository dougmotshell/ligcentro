'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

interface Props {
  locale: string;
  handle: string;
}

/**
 * Exportação e exclusão dos dados — o par que a LGPD exige.
 *
 * A exclusão pede o handle digitado porque é irreversível. O texto diz o que
 * será apagado, sem rodeio e sem tentar dissuadir (regra 3 do AGENTS.md: nada de
 * dark pattern).
 */
export function DangerZone({ locale, handle }: Props) {
  const t = useTranslations('Dashboard.account');
  const router = useRouter();
  const [confirmation, setConfirmation] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorKey, setErrorKey] = useState<string | null>(null);

  const canDelete = confirmation.trim().toLowerCase() === handle.toLowerCase();

  const deleteAccount = async () => {
    setIsDeleting(true);
    setErrorKey(null);

    const response = await fetch('/api/profile/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ confirmHandle: confirmation.trim() }),
    }).catch(() => null);

    if (!response?.ok) {
      setIsDeleting(false);
      setErrorKey('deleteError');
      return;
    }

    // A sessão já foi encerrada pela rota; sair do dashboard evita uma tela que
    // não tem mais dados para mostrar.
    router.push(`/${locale}`);
    router.refresh();
  };

  return (
    <section className="space-y-6 rounded-3xl border border-border bg-white p-8 shadow-sm dark:bg-gray-900">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('title')}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t('description')}</p>
      </div>

      <div className="rounded-2xl border border-border p-5">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{t('exportTitle')}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{t('exportDescription')}</p>
        <a
          href="/api/profile/export"
          download={`ligcentro-${handle}.json`}
          className="mt-4 inline-block rounded-xl border border-border px-4 py-2 text-sm font-medium transition hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {t('exportCta')}
        </a>
      </div>

      <div className="rounded-2xl border border-red-300 p-5 dark:border-red-900">
        <h3 className="text-sm font-semibold text-red-700 dark:text-red-300">{t('deleteTitle')}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{t('deleteDescription')}</p>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          <li>{t('deleteItems.profile')}</li>
          <li>{t('deleteItems.blocks')}</li>
          <li>{t('deleteItems.analytics')}</li>
          <li>{t('deleteItems.handle')}</li>
        </ul>

        <label className="mt-5 block max-w-sm text-sm font-medium text-gray-900 dark:text-white">
          <span>{t('confirmLabel', { handle })}</span>
          <input
            type="text"
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 lowercase outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
          />
        </label>

        <button
          type="button"
          onClick={() => void deleteAccount()}
          disabled={!canDelete || isDeleting}
          aria-busy={isDeleting}
          className="mt-4 rounded-xl bg-red-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isDeleting ? t('deleting') : t('deleteCta')}
        </button>

        {errorKey ? (
          <p role="alert" className="mt-3 text-sm text-red-600">
            {t(errorKey)}
          </p>
        ) : null}
      </div>
    </section>
  );
}
