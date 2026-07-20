'use client';

import { useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import type { Profile } from '@/lib/db/types';

interface Props {
  onUploaded(profile: Profile): void;
}

export function AvatarUpload({ onUploaded }: Props) {
  const t = useTranslations('Dashboard.profile');
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(false);

  return (
    <div className="rounded-2xl border border-dashed border-border p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">{t('avatarTitle')}</h2>
          <p className="text-sm text-muted-foreground">{t('avatarDescription')}</p>
        </div>
        <div className="flex gap-3">
          <input ref={inputRef} type="file" accept="image/*" className="hidden" />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="rounded-xl border border-border px-4 py-2 text-sm font-medium transition hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring"
          >
            {t('chooseFile')}
          </button>
          <button
            type="button"
            disabled={isUploading}
            onClick={async () => {
              const file = inputRef.current?.files?.[0];
              if (!file) {
                return;
              }

              setIsUploading(true);
              setError(false);
              const formData = new FormData();
              formData.set('file', file);
              const response = await fetch('/api/profile/avatar', {
                method: 'POST',
                body: formData,
              });
              setIsUploading(false);

              if (!response.ok) {
                setError(true);
                return;
              }

              const result = (await response.json()) as { profile: Profile };
              onUploaded(result.profile);
              if (inputRef.current) {
                inputRef.current.value = '';
              }
            }}
            className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isUploading ? t('uploading') : t('upload')}
          </button>
        </div>
      </div>
      {error ? <p className="mt-3 text-sm text-red-600">{t('avatarError')}</p> : null}
    </div>
  );
}
