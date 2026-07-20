'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { validateHandle } from '@/lib/handle/validate';

interface Props {
  locale: string;
}

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  handle: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-z0-9_-]+$/),
});

type SignupFormValues = z.infer<typeof signupSchema>;

type HandleState = 'idle' | 'checking' | 'available' | 'taken' | 'invalid';

export function SignupForm({ locale }: Props) {
  const t = useTranslations('Auth');
  const router = useRouter();
  const [handleState, setHandleState] = useState<HandleState>('idle');
  const [handleErrorKey, setHandleErrorKey] = useState<string | null>(null);
  const {
    register,
    watch,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    clearErrors,
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: '',
      password: '',
      handle: '',
    },
  });

  const handleValue = watch('handle');

  useEffect(() => {
    const normalized = handleValue.trim().toLowerCase();

    if (!normalized) {
      setHandleState('idle');
      setHandleErrorKey(null);
      return;
    }

    const validation = validateHandle(normalized);
    if (!validation.valid) {
      const nextErrorKey =
        validation.error === 'reserved'
          ? 'handleReserved'
          : validation.error === 'format' || validation.error === 'length'
            ? 'handleFormat'
            : 'handleFormat';
      setHandleState('invalid');
      setHandleErrorKey(nextErrorKey);
      setError('handle', { message: nextErrorKey });
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setHandleState('checking');
      const response = await fetch(`/api/auth/check-handle?handle=${encodeURIComponent(normalized)}`, {
        signal: controller.signal,
      }).catch(() => null);

      if (!response) {
        setHandleState('idle');
        return;
      }

      const result = (await response.json()) as { available: boolean };

      if (result.available) {
        setHandleState('available');
        setHandleErrorKey(null);
        clearErrors('handle');
        return;
      }

      setHandleState('taken');
      setHandleErrorKey('handleTaken');
      setError('handle', { message: 'handleTaken' });
    }, 350);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [clearErrors, handleValue, setError]);

  const onSubmit = handleSubmit(async (values) => {
    const response = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...values,
        handle: values.handle.toLowerCase(),
      }),
    });

    if (!response.ok) {
      const result = (await response.json().catch(() => ({ error: 'request_failed' }))) as { error?: string };
      setError('root', { message: result.error === 'handle_taken' ? 'handleTaken' : 'request_failed' });
      return;
    }

    router.push(`/${locale}/dashboard`);
    router.refresh();
  });

  const handleStatusText =
    handleState === 'checking'
      ? t('signup.handleChecking')
      : handleState === 'available'
        ? t('signup.handleAvailable')
        : handleErrorKey
          ? t(`errors.${handleErrorKey}`)
          : null;

  return (
    <div className="mx-auto w-full max-w-md rounded-3xl border border-border bg-white p-8 shadow-sm dark:bg-gray-900">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-semibold text-gray-900 dark:text-white">{t('signup.title')}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t('signup.subtitle')}</p>
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

        <label className="block text-sm font-medium text-gray-900 dark:text-white">
          <span>{t('fields.handle')}</span>
          <input
            type="text"
            autoCapitalize="none"
            autoCorrect="off"
            {...register('handle')}
            className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 lowercase outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
          />
          {handleStatusText ? (
            <span className={`mt-1 block text-sm ${handleState === 'available' ? 'text-green-600' : 'text-red-600'}`}>
              {handleStatusText}
            </span>
          ) : null}
        </label>

        {errors.root?.message ? (
          <p className="text-sm text-red-600">{t(`errors.${errors.root.message}`)}</p>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting || handleState === 'checking'}
          className="w-full rounded-xl bg-primary px-4 py-3 font-medium text-primary-foreground transition hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? t('signup.submitting') : t('signup.submit')}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        {t('signup.hasAccount')}{' '}
        <Link
          href={`/${locale}/login`}
          className="font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {t('signup.loginLink')}
        </Link>
      </p>
    </div>
  );
}
