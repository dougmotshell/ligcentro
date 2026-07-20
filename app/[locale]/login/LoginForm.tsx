'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

interface Props {
  locale: string;
}

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm({ locale }: Props) {
  const t = useTranslations('Auth');
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: 'demo@ligcentro.dev',
      password: '123456',
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    });

    if (!response.ok) {
      setError('root', { message: 'request_failed' });
      return;
    }

    router.push(`/${locale}/dashboard`);
    router.refresh();
  });

  return (
    <div className="mx-auto w-full max-w-md rounded-3xl border border-border bg-white p-8 shadow-sm dark:bg-gray-900">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-semibold text-gray-900 dark:text-white">{t('login.title')}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t('login.subtitle')}</p>
      </div>

      <form className="space-y-5" onSubmit={onSubmit}>
        <label className="block text-sm font-medium text-gray-900 dark:text-white">
          <span>{t('fields.email')}</span>
          <input
            type="email"
            {...register('email')}
            className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
          />
          {errors.email ? <span className="mt-1 block text-sm text-red-600">{t('errors.invalidEmail')}</span> : null}
        </label>

        <label className="block text-sm font-medium text-gray-900 dark:text-white">
          <span>{t('fields.password')}</span>
          <input
            type="password"
            {...register('password')}
            className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
          />
          {errors.password ? <span className="mt-1 block text-sm text-red-600">{t('errors.passwordMin')}</span> : null}
        </label>

        {errors.root?.message ? (
          <p className="text-sm text-red-600">{t(`errors.${errors.root.message}`)}</p>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-xl bg-primary px-4 py-3 font-medium text-primary-foreground transition hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? t('login.submitting') : t('login.submit')}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        {t('login.noAccount')}{' '}
        <Link
          href={`/${locale}/signup`}
          className="font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {t('login.signupLink')}
        </Link>
      </p>
    </div>
  );
}
