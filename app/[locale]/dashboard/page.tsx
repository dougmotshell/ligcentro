import { cookies } from 'next/headers';
import { setRequestLocale } from 'next-intl/server';
import { redirect } from 'next/navigation';
import { getSession } from '@/adapters/auth';
import { getDashboardProfile } from '@/lib/db/dashboard';
import { LogoutButton } from './LogoutButton';
import { DashboardShell } from './_components/DashboardShell';
import { buildPublicProfileUrl, renderQrSvg } from '@/lib/qr/generate';

export default async function DashboardPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const cookieStore = await cookies();
  const session = await getSession(cookieStore);

  if (!session) {
    redirect(`/${locale}/login`);
  }

  const profile = await getDashboardProfile(session);

  if (!profile) {
    redirect(`/${locale}/signup`);
  }

  const publicUrl = buildPublicProfileUrl(profile.handle);
  const qrSvg = await renderQrSvg(publicUrl);

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-12 dark:bg-gray-950">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex justify-end">
          <LogoutButton locale={locale} />
        </div>
        <DashboardShell
          locale={locale}
          initialProfile={profile}
          publicUrl={publicUrl}
          qrSvg={qrSvg}
        />
      </div>
    </main>
  );
}
