'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { Profile, ThemeButtonShape, ThemeConfig, ThemeFont } from '@/lib/db/types';
import {
  BUTTON_SHAPE_NAMES,
  BUTTON_SHAPE_RADIUS,
  THEME_FONTS,
  THEME_FONT_NAMES,
  THEME_PRESETS,
  isValidThemeColor,
} from '@/lib/theme/presets';

interface Props {
  profile: Profile;
  onSaved(profile: Profile): void;
}

export function ThemeSelector({ profile, onSaved }: Props) {
  const t = useTranslations('Dashboard.themes');
  const [pending, setPending] = useState<string | null>(null);
  const [hasError, setHasError] = useState(false);

  const theme = profile.theme;

  const save = async (patch: Partial<ThemeConfig>, pendingKey: string) => {
    setPending(pendingKey);
    setHasError(false);

    const response = await fetch('/api/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ theme: { ...theme, ...patch } }),
    }).catch(() => null);

    setPending(null);

    if (!response?.ok) {
      setHasError(true);
      return;
    }

    const result = (await response.json()) as { profile: Profile };
    onSaved(result.profile);
  };

  return (
    <div className="space-y-10">
      <fieldset>
        <legend className="text-sm font-semibold text-gray-900 dark:text-white">
          {t('presetsLegend')}
        </legend>
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Object.values(THEME_PRESETS).map((preset) => {
            const isActive = theme.name === preset.name;

            return (
              <button
                key={preset.name}
                type="button"
                onClick={() => void save(preset, `preset:${preset.name}`)}
                aria-pressed={isActive}
                className={`rounded-2xl border p-4 text-left transition focus-visible:ring-2 focus-visible:ring-ring ${
                  isActive ? 'border-primary shadow-md' : 'border-border hover:border-primary/40'
                }`}
              >
                <div className="rounded-xl p-4" style={{ backgroundColor: preset.bg }}>
                  <div
                    className="px-3 py-2 text-sm font-medium"
                    style={{
                      backgroundColor: preset.btnBg,
                      color: preset.btnText,
                      borderRadius: BUTTON_SHAPE_RADIUS[preset.buttonShape],
                      fontFamily: THEME_FONTS[preset.font],
                    }}
                  >
                    {t(`names.${preset.name}`)}
                  </div>
                </div>
                <p className="mt-3 text-sm font-semibold text-gray-900 dark:text-white">
                  {t(`names.${preset.name}`)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {pending === `preset:${preset.name}`
                    ? t('saving')
                    : isActive
                      ? t('selected')
                      : t('select')}
                </p>
              </button>
            );
          })}
        </div>
      </fieldset>

      <fieldset className="space-y-6">
        <legend className="text-sm font-semibold text-gray-900 dark:text-white">
          {t('customLegend')}
        </legend>
        <p className="text-sm text-muted-foreground">{t('customDescription')}</p>

        <div className="grid gap-6 md:grid-cols-3">
          <ColorField
            label={t('fields.bg')}
            value={theme.bg}
            onCommit={(value) => void save({ bg: value }, 'bg')}
          />
          <ColorField
            label={t('fields.btnBg')}
            value={theme.btnBg}
            onCommit={(value) => void save({ btnBg: value }, 'btnBg')}
          />
          <ColorField
            label={t('fields.btnText')}
            value={theme.btnText}
            onCommit={(value) => void save({ btnText: value }, 'btnText')}
          />
        </div>

        <label className="block max-w-xs text-sm font-medium text-gray-900 dark:text-white">
          <span>{t('fields.font')}</span>
          <select
            value={theme.font}
            onChange={(event) => void save({ font: event.target.value as ThemeFont }, 'font')}
            className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
          >
            {THEME_FONT_NAMES.map((font) => (
              <option key={font} value={font}>
                {t(`fonts.${font}`)}
              </option>
            ))}
          </select>
        </label>

        <fieldset>
          <legend className="text-sm font-medium text-gray-900 dark:text-white">
            {t('fields.buttonShape')}
          </legend>
          <div className="mt-3 flex flex-wrap gap-3">
            {BUTTON_SHAPE_NAMES.map((shape) => (
              <button
                key={shape}
                type="button"
                aria-pressed={theme.buttonShape === shape}
                onClick={() => void save({ buttonShape: shape as ThemeButtonShape }, 'shape')}
                className={`border px-4 py-3 text-sm font-medium transition focus-visible:ring-2 focus-visible:ring-ring ${
                  theme.buttonShape === shape
                    ? 'border-primary bg-secondary'
                    : 'border-border hover:border-primary/40'
                }`}
                style={{ borderRadius: BUTTON_SHAPE_RADIUS[shape] }}
              >
                {t(`shapes.${shape}`)}
              </button>
            ))}
          </div>
        </fieldset>

        <label className="flex max-w-xl items-start gap-3 text-sm text-gray-900 dark:text-white">
          <input
            type="checkbox"
            checked={theme.useBrandColors}
            onChange={(event) => void save({ useBrandColors: event.target.checked }, 'brand')}
            className="mt-1 h-4 w-4 rounded border-border focus-visible:ring-2 focus-visible:ring-ring"
          />
          <span>
            <span className="font-medium">{t('fields.useBrandColors')}</span>
            <span className="mt-1 block text-muted-foreground">{t('brandColorsHint')}</span>
          </span>
        </label>

        {hasError ? (
          <p role="alert" className="text-sm text-red-600">
            {t('error')}
          </p>
        ) : null}
      </fieldset>
    </div>
  );
}

interface ColorFieldProps {
  label: string;
  value: string;
  onCommit(value: string): void;
}

/**
 * Campo de cor com entrada dupla: o seletor nativo e o hexadecimal digitado.
 *
 * O texto só é enviado quando forma um hexadecimal válido — a mesma regra que o
 * servidor aplica, para a pessoa não ver como "aceito" um valor que o servidor
 * descartaria.
 */
function ColorField({ label, value, onCommit }: ColorFieldProps) {
  const [draft, setDraft] = useState(value);

  return (
    <label className="block text-sm font-medium text-gray-900 dark:text-white">
      <span>{label}</span>
      <span className="mt-2 flex items-center gap-3">
        <input
          type="color"
          value={isValidThemeColor(draft) ? draft : value}
          onChange={(event) => {
            setDraft(event.target.value);
            onCommit(event.target.value);
          }}
          className="h-11 w-14 cursor-pointer rounded-lg border border-border bg-background focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={label}
        />
        <input
          type="text"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={() => {
            if (isValidThemeColor(draft)) {
              onCommit(draft);
              return;
            }

            setDraft(value);
          }}
          spellCheck={false}
          className="w-28 rounded-xl border border-border bg-background px-3 py-2 font-mono text-sm uppercase outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
        />
      </span>
    </label>
  );
}
