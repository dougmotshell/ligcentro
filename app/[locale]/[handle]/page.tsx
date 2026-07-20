import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { BlockContact } from '@/components/blocks/BlockContact';
import { BlockLink } from '@/components/blocks/BlockLink';
import { BlockSocial } from '@/components/blocks/BlockSocial';
import {
  getFallbackProfileByHandle,
  getProfileByHandle,
  getPublishedHandles,
} from '@/lib/db/profiles';
import { getSafeImageUrl } from '@/lib/safe-url';

interface Props {
  params: Promise<{ locale: string; handle: string }>;
}

export const revalidate = 3600;

export async function generateStaticParams() {
  try {
    const handles = await getPublishedHandles();
    const locales = ['pt-BR', 'en-US'];

    return locales.flatMap((locale) => handles.map((handle) => ({ locale, handle })));
  } catch {
    return ['pt-BR', 'en-US'].map((locale) => ({ locale, handle: 'demo' }));
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, handle } = await params;
  setRequestLocale(locale);
  const notFoundTranslations = await getTranslations({ locale, namespace: 'NotFound' });

  try {
    const profile = await getProfileByHandle(handle);

    if (!profile) {
      return { title: notFoundTranslations('profileNotFound') };
    }

    const avatarUrl = getSafeImageUrl(profile.avatar_url);
    const openGraphImageUrl = avatarUrl
      ? new URL(avatarUrl, process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000').toString()
      : null;

    return {
      title: profile.display_name,
      description: profile.bio ?? undefined,
      openGraph: {
        title: profile.display_name,
        description: profile.bio ?? undefined,
        images: openGraphImageUrl ? [{ url: openGraphImageUrl }] : [],
      },
    };
  } catch {
    const fallbackProfile = getFallbackProfileByHandle(handle);

    if (!fallbackProfile) {
      return { title: 'ligcentro' };
    }

    return {
      title: fallbackProfile.display_name,
      description: fallbackProfile.bio ?? undefined,
      openGraph: {
        title: fallbackProfile.display_name,
        description: fallbackProfile.bio ?? undefined,
        images: [
          {
            url: new URL(
              fallbackProfile.avatar_url ?? '/demo-avatar.svg',
              process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
            ).toString(),
          },
        ],
      },
    };
  }
}

export default async function ProfilePage({ params }: Props) {
  const { locale, handle } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'ProfilePage' });

  let profile;

  try {
    profile = await getProfileByHandle(handle);
  } catch {
    profile = getFallbackProfileByHandle(handle);
  }

  if (!profile) {
    notFound();
  }

  const avatarUrl = getSafeImageUrl(profile.avatar_url);

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-12 dark:bg-gray-900">
      <div className="mx-auto max-w-md">
        <div className="mb-8 text-center">
          {avatarUrl ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element -- Avatar remoto vem do perfil publicado e não deve acionar fetch server-side. */}
              <img
                src={avatarUrl}
                alt={profile.display_name}
                width={96}
                height={96}
                className="mx-auto mb-4 h-24 w-24 rounded-full object-cover"
              />
            </>
          ) : (
            <div
              className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400 to-purple-500"
              aria-hidden="true"
            >
              <span className="text-3xl font-bold text-white">
                {profile.display_name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}

          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{profile.display_name}</h1>

          {profile.bio ? (
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{profile.bio}</p>
          ) : null}
        </div>

        <div className="space-y-3">
          {profile.blocks.map((block) => {
            if (block.type === 'link') {
              return <BlockLink key={block.id} block={block} />;
            }

            if (block.type === 'social') {
              return <BlockSocial key={block.id} block={block} />;
            }

            if (block.type === 'contact') {
              return <BlockContact key={block.id} block={block} />;
            }

            return null;
          })}
        </div>

        <p className="mt-10 text-center text-xs text-gray-400">{t('poweredBy')}</p>
      </div>
    </main>
  );
}
