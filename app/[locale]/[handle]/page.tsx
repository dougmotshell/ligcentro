import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { BlockContact } from '@/components/blocks/BlockContact';
import { BlockLink } from '@/components/blocks/BlockLink';
import { BlockSocial } from '@/components/blocks/BlockSocial';
import { getFallbackProfileByHandle, getProfileByHandle, getPublishedHandles } from '@/lib/db/profiles';
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
  const tNotFound = await getTranslations({ locale, namespace: 'NotFound' });

  try {
    const profile = await getProfileByHandle(handle);

    if (!profile) {
      return { title: tNotFound('profileNotFound') };
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
    <main className="min-h-screen px-4 py-12" style={{ backgroundColor: profile.theme.bg }}>
      <div className="mx-auto max-w-md rounded-[2rem] bg-white/80 p-8 shadow-xl ring-1 ring-black/5 backdrop-blur dark:bg-gray-900/80">
        <div className="mb-8 text-center">
          {avatarUrl ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element -- Avatar remoto do perfil público não deve acionar fetch server-side. */}
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
              className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full"
              style={{ backgroundColor: profile.theme.btnBg, color: profile.theme.btnText }}
              aria-hidden="true"
            >
              <span className="text-3xl font-bold">{profile.display_name.charAt(0).toUpperCase()}</span>
            </div>
          )}

          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{profile.display_name}</h1>

          {profile.bio ? <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{profile.bio}</p> : null}
        </div>

        <div className="space-y-3">
          {profile.blocks.map((block) => {
            if (block.type === 'link') {
              return <BlockLink key={block.id} block={block} theme={profile.theme} />;
            }

            if (block.type === 'social') {
              return <BlockSocial key={block.id} block={block} theme={profile.theme} />;
            }

            if (block.type === 'contact') {
              return <BlockContact key={block.id} block={block} theme={profile.theme} />;
            }

            return null;
          })}
        </div>

        <p className="mt-10 text-center text-xs text-gray-500 dark:text-gray-400">{t('poweredBy')}</p>
      </div>
    </main>
  );
}
