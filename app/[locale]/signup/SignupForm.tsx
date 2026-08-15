'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { validateHandle } from '@/lib/handle/validate';
import { AuthRedirectAlert } from '@/components/auth/AuthRedirectAlert';
import { SocialAuthButtons } from '@/components/auth/SocialAuthButtons';

interface Props {
  locale: string;
  /**
   * Código de erro vindo de um redirecionamento (`?error=`). O cadastro também
   * inicia fluxo OAuth, então a falha volta para cá — não para o login.
   */
  redirectError?: string | null;
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

/** Resultado da consulta de disponibilidade; a validação de formato é derivada. */
type AvailabilityState = 'idle' | 'checking' | 'available' | 'taken';

export function SignupForm({ locale, redirectError = null }: Props) {
  const t = useTranslations('Auth');
  const router = useRouter();
  const [availability, setAvailability] = useState<AvailabilityState>('idle');
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: '',
      password: '',
      handle: '',
    },
  });

  // `useWatch` e não `watch`: `watch()` não é a API reativa — não garante nova
  // renderização, então a dependência do efeito nunca mudava e a verificação de
  // disponibilidade nunca era disparada (TCK-0019).
  const normalizedHandle = (useWatch({ control, name: 'handle' }) ?? '').trim().toLowerCase();

  // Formato e reserva são função pura do valor: calculados na renderização, sem
  // estado espelhado. Só a consulta ao servidor precisa de estado e de efeito —
  // e assim o efeito não chama `setState` de forma sincrônica.
  const formatError = normalizedHandle ? validateHandle(normalizedHandle).error : undefined;

  useEffect(() => {
    if (!normalizedHandle || formatError) {
      return;
    }

    const controller = new AbortController();
    let cancelled = false;

    const timer = window.setTimeout(async () => {
      setAvailability('checking');

      const response = await fetch(
        `/api/auth/check-handle?handle=${encodeURIComponent(normalizedHandle)}`,
        { signal: controller.signal }
      ).catch(() => null);

      if (cancelled) {
        return;
      }

      if (!response?.ok) {
        setAvailability('idle');
        return;
      }

      const result = (await response.json().catch(() => null)) as { available: boolean } | null;

      if (cancelled) {
        return;
      }

      setAvailability(result?.available ? 'available' : 'taken');
    }, 350);

    return () => {
      cancelled = true;
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [formatError, normalizedHandle]);

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
      const result = (await response.json().catch(() => ({ error: 'request_failed' }))) as {
        error?: string;
      };
      const errorKey =
        result.error === 'handle_taken'
          ? 'handleTaken'
          : result.error === 'account_already_exists'
            ? 'account_already_exists'
            : 'request_failed';
      setError('root', { message: errorKey });
      return;
    }

    const result = (await response.json().catch(() => ({}))) as {
      pendingEmailConfirmation?: boolean;
    };

    // Com confirmação de e-mail ligada no Supabase, a conta existe e o handle já
    // está reservado, mas a sessão só nasce quando o link do e-mail é aberto.
    if (result.pendingEmailConfirmation) {
      setPendingEmail(values.email);
      return;
    }

    router.push(`/${locale}/onboarding?step=1`);
    router.refresh();
  });

  const handleErrorKey = formatError
    ? formatError === 'reserved'
      ? 'handleReserved'
      : 'handleFormat'
    : availability === 'taken'
      ? 'handleTaken'
      : null;

  const handleStatusText = !normalizedHandle
    ? null
    : handleErrorKey
      ? t(`errors.${handleErrorKey}`)
      : availability === 'checking'
        ? t('signup.handleChecking')
        : availability === 'available'
          ? t('signup.handleAvailable')
          : null;

  if (pendingEmail) {
    return (
      <div className="mx-auto w-full max-w-md rounded-3xl border border-border bg-white p-8 text-center shadow-sm dark:bg-gray-900">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          {t('signup.confirmEmailTitle')}
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          {t('signup.confirmEmailDescription', { email: pendingEmail })}
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          {t('signup.confirmEmailHandleReserved')}
        </p>
        <Link
          href={`/${locale}/login`}
          className="mt-6 inline-block font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {t('signup.loginLink')}
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-md rounded-3xl border border-border bg-white p-8 shadow-sm dark:bg-gray-900">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-semibold text-gray-900 dark:text-white">
          {t('signup.title')}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">{t('signup.subtitle')}</p>
      </div>

      <AuthRedirectAlert error={redirectError} />

      <form className="space-y-5" onSubmit={onSubmit}>
        <label className="block text-sm font-medium text-gray-900 dark:text-white">
          <span>{t('fields.email')}</span>
          <input
            type="email"
            {...register('email')}
            className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
          />
          {errors.email ? (
            <span className="mt-1 block text-sm text-red-600">{t('errors.invalidEmail')}</span>
          ) : null}
        </label>

        <label className="block text-sm font-medium text-gray-900 dark:text-white">
          <span>{t('fields.password')}</span>
          <input
            type="password"
            {...register('password')}
            className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
          />
          {errors.password ? (
            <span className="mt-1 block text-sm text-red-600">{t('errors.passwordMin')}</span>
          ) : null}
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
            <span
              className={`mt-1 block text-sm ${!handleErrorKey ? 'text-green-600' : 'text-red-600'}`}
            >
              {handleStatusText}
            </span>
          ) : null}
        </label>

        {errors.root?.message ? (
          <p className="text-sm text-red-600">{t(`errors.${errors.root.message}`)}</p>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting || availability === 'checking' || Boolean(handleErrorKey)}
          className="w-full rounded-xl bg-primary px-4 py-3 font-medium text-primary-foreground transition hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? t('signup.submitting') : t('signup.submit')}
        </button>
      </form>

      {/* Cadastro social na mesma tela: antes só existia no login, e quem chegava
          aqui precisava descobrir sozinho que a opção morava em outra página. */}
      <SocialAuthButtons locale={locale} from="signup" />

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
