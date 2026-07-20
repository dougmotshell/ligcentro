'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import type { ProfileWithBlocks } from '@/lib/db/types';

interface Props {
  locale: string;
  initialProfile: ProfileWithBlocks;
}

export function OnboardingWizard({ locale, initialProfile }: Props) {
  const t = useTranslations('Onboarding');
  const router = useRouter();
  const searchParams = useSearchParams();
  const [profile, setProfile] = useState(initialProfile);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const step = Math.min(Math.max(Number(searchParams.get('step') ?? '1'), 1), 3);

  const progress = useMemo(() => (step / 3) * 100, [step]);

  const goToStep = (nextStep: number) => {
    router.push(`/${locale}/onboarding?step=${nextStep}`);
  };

  return (
    <div className="space-y-8 rounded-3xl border border-border bg-white p-8 shadow-sm dark:bg-gray-900">
      <div>
        <p className="text-sm font-medium text-primary">{t('eyebrow')}</p>
        <h1 className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">{t(`steps.${step}.title`)}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t(`steps.${step}.description`)}</p>
        <div className="mt-6 h-2 rounded-full bg-secondary">
          <div className="h-2 rounded-full bg-primary" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {step === 1 ? (
        <form
          className="space-y-5"
          onSubmit={async (event) => {
            event.preventDefault();
            setIsSubmitting(true);
            setErrorKey(null);
            const formData = new FormData(event.currentTarget);
            const handle = String(formData.get('handle') ?? '').toLowerCase();
            const response = await fetch('/api/profile', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ handle }),
            });
            setIsSubmitting(false);
            if (!response.ok) {
              const result = (await response.json().catch(() => ({ error: 'request_failed' }))) as { error?: string };
              setErrorKey(result.error === 'handle_taken' ? 'handleTaken' : 'handleInvalid');
              return;
            }
            const result = (await response.json()) as { profile: ProfileWithBlocks };
            setProfile((current) => ({ ...current, ...result.profile }));
            goToStep(2);
          }}
        >
          <label className="block text-sm font-medium text-gray-900 dark:text-white">
            <span>{t('fields.handle')}</span>
            <input
              type="text"
              name="handle"
              defaultValue={profile.handle}
              autoCapitalize="none"
              autoCorrect="off"
              className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 lowercase outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
            />
          </label>
          {errorKey ? <p className="text-sm text-red-600">{t(`errors.${errorKey}`)}</p> : null}
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-xl bg-primary px-4 py-3 font-medium text-primary-foreground transition hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-70"
          >
            {isSubmitting ? t('actions.saving') : t('actions.continue')}
          </button>
        </form>
      ) : null}

      {step === 2 ? (
        <form
          className="space-y-5"
          onSubmit={async (event) => {
            event.preventDefault();
            setIsSubmitting(true);
            setErrorKey(null);
            const formData = new FormData(event.currentTarget);
            const file = formData.get('avatar');
            if (file instanceof File && file.size > 0) {
              const avatarForm = new FormData();
              avatarForm.set('file', file);
              await fetch('/api/profile/avatar', { method: 'POST', body: avatarForm });
            }
            const response = await fetch('/api/profile', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                displayName: String(formData.get('displayName') ?? ''),
                bio: String(formData.get('bio') ?? ''),
              }),
            });
            setIsSubmitting(false);
            if (!response.ok) {
              setErrorKey('requestFailed');
              return;
            }
            const result = (await response.json()) as { profile: ProfileWithBlocks };
            setProfile((current) => ({ ...current, ...result.profile }));
            goToStep(3);
          }}
        >
          <label className="block text-sm font-medium text-gray-900 dark:text-white">
            <span>{t('fields.displayName')}</span>
            <input
              type="text"
              name="displayName"
              defaultValue={profile.display_name}
              className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
            />
          </label>
          <label className="block text-sm font-medium text-gray-900 dark:text-white">
            <span>{t('fields.bio')}</span>
            <textarea
              name="bio"
              rows={4}
              defaultValue={profile.bio ?? ''}
              className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
            />
          </label>
          <label className="block text-sm font-medium text-gray-900 dark:text-white">
            <span>{t('fields.avatar')}</span>
            <input
              type="file"
              name="avatar"
              accept="image/*"
              className="mt-2 block w-full rounded-xl border border-border bg-background px-4 py-3 text-sm"
            />
          </label>
          {errorKey ? <p className="text-sm text-red-600">{t(`errors.${errorKey}`)}</p> : null}
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-xl bg-primary px-4 py-3 font-medium text-primary-foreground transition hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-70"
          >
            {isSubmitting ? t('actions.saving') : t('actions.continue')}
          </button>
        </form>
      ) : null}

      {step === 3 ? (
        <form
          className="space-y-5"
          onSubmit={async (event) => {
            event.preventDefault();
            setIsSubmitting(true);
            setErrorKey(null);
            const formData = new FormData(event.currentTarget);
            const createBlock = await fetch('/api/blocks', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                type: 'link',
                label: String(formData.get('label') ?? ''),
                url: String(formData.get('url') ?? ''),
              }),
            });
            if (!createBlock.ok) {
              setIsSubmitting(false);
              setErrorKey('requestFailed');
              return;
            }
            await fetch('/api/profile', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ status: 'published' }),
            });
            setIsSubmitting(false);
            router.push(`/${locale}/dashboard`);
            router.refresh();
          }}
        >
          <label className="block text-sm font-medium text-gray-900 dark:text-white">
            <span>{t('fields.firstLinkLabel')}</span>
            <input
              type="text"
              name="label"
              className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
            />
          </label>
          <label className="block text-sm font-medium text-gray-900 dark:text-white">
            <span>{t('fields.firstLinkUrl')}</span>
            <input
              type="url"
              name="url"
              className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
            />
          </label>
          {errorKey ? <p className="text-sm text-red-600">{t(`errors.${errorKey}`)}</p> : null}
          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-primary px-4 py-3 font-medium text-primary-foreground transition hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-70"
            >
              {isSubmitting ? t('actions.finishing') : t('actions.finish')}
            </button>
            <Link
              href={`/${locale}/dashboard`}
              className="rounded-xl border border-border px-4 py-3 text-sm font-medium transition hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {t('actions.skip')}
            </Link>
          </div>
        </form>
      ) : null}
    </div>
  );
}
