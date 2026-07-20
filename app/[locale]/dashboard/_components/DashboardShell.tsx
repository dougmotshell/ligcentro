'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { ProfileWithBlocks } from '@/lib/db/types';
import { AvatarUpload } from './AvatarUpload';
import { BlockList } from './BlockList';
import { ProfileForm } from './ProfileForm';
import { ThemeSelector } from './ThemeSelector';

interface Props {
  locale: string;
  initialProfile: ProfileWithBlocks;
}

type TabKey = 'profile' | 'blocks' | 'themes';

export function DashboardShell({ locale, initialProfile }: Props) {
  const t = useTranslations('Dashboard');
  const [activeTab, setActiveTab] = useState<TabKey>('profile');
  const [profile, setProfile] = useState(initialProfile);

  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-4 rounded-3xl border border-border bg-white p-8 shadow-sm dark:bg-gray-900 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">{t('eyebrow')}</p>
          <h1 className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">{t('title')}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t('description')}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href={`/${locale}/${profile.handle}`}
            className="rounded-xl border border-border px-4 py-3 text-sm font-medium transition hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring"
          >
            {t('viewPublicProfile')}
          </Link>
          <Link
            href={`/${locale}/dashboard/analytics`}
            className="rounded-xl border border-border px-4 py-3 text-sm font-medium transition hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring"
          >
            {t('analyticsCta')}
          </Link>
        </div>
      </section>

      <nav className="flex flex-wrap gap-3" aria-label={t('tabsAriaLabel')}>
        {(['profile', 'blocks', 'themes'] as TabKey[]).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`rounded-xl px-4 py-3 text-sm font-medium transition focus-visible:ring-2 focus-visible:ring-ring ${
              activeTab === tab ? 'bg-primary text-primary-foreground' : 'border border-border bg-white hover:bg-secondary dark:bg-gray-900'
            }`}
          >
            {t(`tabs.${tab}`)}
          </button>
        ))}
      </nav>

      {activeTab === 'profile' ? (
        <section className="space-y-6 rounded-3xl border border-border bg-white p-8 shadow-sm dark:bg-gray-900">
          <AvatarUpload
            onUploaded={(nextProfile) => {
              setProfile((current) => ({ ...current, ...nextProfile }));
            }}
          />
          <ProfileForm
            profile={profile}
            onSaved={(nextProfile) => setProfile((current) => ({ ...current, ...nextProfile }))}
          />
        </section>
      ) : null}

      {activeTab === 'blocks' ? (
        <section className="rounded-3xl border border-border bg-gray-50 p-8 shadow-sm dark:bg-gray-950">
          <BlockList
            blocks={profile.blocks}
            onBlocksChange={(blocks) => setProfile((current) => ({ ...current, blocks }))}
          />
        </section>
      ) : null}

      {activeTab === 'themes' ? (
        <section className="rounded-3xl border border-border bg-white p-8 shadow-sm dark:bg-gray-900">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('themesTitle')}</h2>
            <p className="text-sm text-muted-foreground">{t('themesDescription')}</p>
          </div>
          <ThemeSelector profile={profile} onSaved={(nextProfile) => setProfile((current) => ({ ...current, ...nextProfile }))} />
        </section>
      ) : null}
    </div>
  );
}
