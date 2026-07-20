'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { Profile, ThemeConfig } from '@/lib/db/types';
import { THEME_PRESETS } from '@/lib/theme/presets';

interface Props {
  profile: Profile;
  onSaved(profile: Profile): void;
}

export function ThemeSelector({ profile, onSaved }: Props) {
  const t = useTranslations('Dashboard.themes');
  const [isSaving, setIsSaving] = useState<string | null>(null);

  const saveTheme = async (theme: ThemeConfig) => {
    setIsSaving(theme.name);
    const response = await fetch('/api/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ theme }),
    });
    setIsSaving(null);

    if (!response.ok) {
      return;
    }

    const result = (await response.json()) as { profile: Profile };
    onSaved(result.profile);
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {Object.values(THEME_PRESETS).map((theme) => {
        const isActive = profile.theme.name === theme.name;
        return (
          <button
            key={theme.name}
            type="button"
            onClick={() => void saveTheme(theme)}
            className={`rounded-2xl border p-4 text-left transition focus-visible:ring-2 focus-visible:ring-ring ${
              isActive ? 'border-primary shadow-md' : 'border-border hover:border-primary/40'
            }`}
          >
            <div className="rounded-xl p-4" style={{ backgroundColor: theme.bg }}>
              <div className="rounded-lg px-3 py-2 text-sm font-medium" style={{ backgroundColor: theme.btnBg, color: theme.btnText }}>
                {t(`names.${theme.name}`)}
              </div>
            </div>
            <p className="mt-3 text-sm font-semibold text-gray-900 dark:text-white">{t(`names.${theme.name}`)}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {isSaving === theme.name ? t('saving') : isActive ? t('selected') : t('select')}
            </p>
          </button>
        );
      })}
    </div>
  );
}
