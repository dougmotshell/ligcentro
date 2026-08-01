'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { Profile } from '@/lib/db/types';

interface Props {
  profile: Profile;
  publicUrl: string;
  /** SVG do QR já gerado no servidor — o cliente não carrega gerador nenhum. */
  qrSvg: string;
  onSaved(profile: Profile): void;
}

/**
 * Publicação e compartilhamento.
 *
 * Antes desta tela só o onboarding publicava: quem o abandonasse ficava com a
 * página invisível e sem nenhum caminho para publicá-la.
 */
export function SharePanel({ profile, publicUrl, qrSvg, onSaved }: Props) {
  const t = useTranslations('Dashboard.share');
  const [isSaving, setIsSaving] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [copied, setCopied] = useState(false);

  const isPublished = profile.status === 'published';

  const toggleStatus = async () => {
    setIsSaving(true);
    setHasError(false);

    const response = await fetch('/api/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: isPublished ? 'draft' : 'published' }),
    }).catch(() => null);

    setIsSaving(false);

    if (!response?.ok) {
      setHasError(true);
      return;
    }

    const result = (await response.json()) as { profile: Profile };
    onSaved(result.profile);
  };

  const copyUrl = async () => {
    // `navigator.clipboard` não existe em contexto não seguro (http). Confirmar
    // "copiado" sem ter copiado seria mentir para quem clicou.
    if (!navigator.clipboard) {
      setHasError(true);
      return;
    }

    try {
      await navigator.clipboard.writeText(publicUrl);
    } catch {
      setHasError(true);
      return;
    }

    setHasError(false);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  const qrDataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(qrSvg)}`;

  return (
    <section className="rounded-3xl border border-border bg-white p-8 shadow-sm dark:bg-gray-900">
      <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('title')}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{t('description')}</p>
          </div>

          <p className="flex items-center gap-2 text-sm">
            <span
              aria-hidden="true"
              className={`inline-block h-2.5 w-2.5 rounded-full ${isPublished ? 'bg-green-600' : 'bg-amber-500'}`}
            />
            <span className="font-medium text-gray-900 dark:text-white">
              {isPublished ? t('statusPublished') : t('statusDraft')}
            </span>
          </p>
          <p className="text-sm text-muted-foreground">
            {isPublished ? t('publishedHint') : t('draftHint')}
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => void toggleStatus()}
              disabled={isSaving}
              aria-busy={isSaving}
              className={`rounded-xl px-4 py-3 text-sm font-medium transition focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-70 ${
                isPublished
                  ? 'border border-border hover:bg-secondary'
                  : 'bg-primary text-primary-foreground hover:opacity-90'
              }`}
            >
              {isSaving ? t('saving') : isPublished ? t('unpublish') : t('publish')}
            </button>

            <button
              type="button"
              onClick={() => void copyUrl()}
              className="rounded-xl border border-border px-4 py-3 text-sm font-medium transition hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring"
            >
              {copied ? t('copied') : t('copyUrl')}
            </button>
          </div>

          <p className="break-all text-xs text-muted-foreground">{publicUrl}</p>

          {hasError ? (
            <p role="alert" className="text-sm text-red-600">
              {t('error')}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col items-center gap-3">
          {/*
            O SVG vem do gerador do servidor sobre a nossa própria URL e contém
            apenas <svg> e <path> — o texto codificado não aparece literalmente
            no markup (verificado), então não há vetor de injeção pelo handle.
          */}
          <div
            className="w-40 rounded-2xl bg-white p-3 ring-1 ring-black/5"
            role="img"
            aria-label={t('qrAriaLabel', { handle: profile.handle })}
            dangerouslySetInnerHTML={{ __html: qrSvg }}
          />
          <a
            href={qrDataUrl}
            download={`ligcentro-${profile.handle}.svg`}
            className="rounded-xl border border-border px-4 py-2 text-sm font-medium transition hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {t('downloadQr')}
          </a>
        </div>
      </div>
    </section>
  );
}
