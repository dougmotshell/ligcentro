'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import type { Profile } from '@/lib/db/types';

const profileSchema = z.object({
  displayName: z.string().min(2).max(80),
  bio: z.string().max(280),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

interface Props {
  profile: Profile;
  onSaved(profile: Profile): void;
}

export function ProfileForm({ profile, onSaved }: Props) {
  const t = useTranslations('Dashboard.profile');
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: profile.display_name,
      bio: profile.bio ?? '',
    },
  });

  useEffect(() => {
    reset({
      displayName: profile.display_name,
      bio: profile.bio ?? '',
    });
  }, [profile.bio, profile.display_name, reset]);

  const onSubmit = handleSubmit(async (values) => {
    const response = await fetch('/api/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    });

    if (!response.ok) {
      setError('root', { message: 'request_failed' });
      return;
    }

    const result = (await response.json()) as { profile: Profile };
    onSaved(result.profile);
  });

  return (
    <form className="space-y-5" onSubmit={onSubmit}>
      <label className="block text-sm font-medium text-gray-900 dark:text-white">
        <span>{t('displayName')}</span>
        <input
          type="text"
          {...register('displayName')}
          className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
        />
        {errors.displayName ? <span className="mt-1 block text-sm text-red-600">{t('displayNameError')}</span> : null}
      </label>

      <label className="block text-sm font-medium text-gray-900 dark:text-white">
        <span>{t('bio')}</span>
        <textarea
          rows={4}
          {...register('bio')}
          className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
        />
        {errors.bio ? <span className="mt-1 block text-sm text-red-600">{t('bioError')}</span> : null}
      </label>

      {errors.root?.message ? <p className="text-sm text-red-600">{t('requestError')}</p> : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-xl bg-primary px-4 py-3 font-medium text-primary-foreground transition hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isSubmitting ? t('saving') : t('save')}
      </button>
    </form>
  );
}
