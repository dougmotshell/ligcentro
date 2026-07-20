'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import type { Block } from '@/lib/db/types';
import { CONTACT_TYPES, SOCIAL_PLATFORMS } from '@/lib/blocks/normalize';

const blockSchema = z.object({
  type: z.enum(['link', 'social', 'contact']),
  label: z.string().min(1).max(80),
  url: z.string(),
  brand: z.string(),
  contactType: z.string(),
  contactValue: z.string(),
  visibleFrom: z.string(),
  visibleUntil: z.string(),
  isActive: z.boolean(),
});

type BlockFormValues = z.infer<typeof blockSchema>;

interface Props {
  open: boolean;
  block: Block | null;
  onClose(): void;
  onSubmit(values: BlockFormValues): Promise<void>;
}

function getDefaults(block: Block | null): BlockFormValues {
  if (!block) {
    return {
      type: 'link',
      label: '',
      url: '',
      brand: 'instagram',
      contactType: 'whatsapp',
      contactValue: '',
      visibleFrom: '',
      visibleUntil: '',
      isActive: true,
    };
  }

  return {
    type: block.type as 'link' | 'social' | 'contact',
    label: block.label ?? '',
    url: block.type === 'contact' ? '' : block.url ?? '',
    brand: typeof block.config.brand === 'string' ? block.config.brand : 'instagram',
    contactType: typeof block.config.type === 'string' ? block.config.type : 'whatsapp',
    contactValue: typeof block.config.value === 'string' ? block.config.value : '',
    visibleFrom: block.visible_from ? block.visible_from.slice(0, 16) : '',
    visibleUntil: block.visible_until ? block.visible_until.slice(0, 16) : '',
    isActive: block.is_active,
  };
}

export function BlockForm({ open, block, onClose, onSubmit }: Props) {
  const t = useTranslations('Dashboard.blocks');
  const {
    register,
    watch,
    reset,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<BlockFormValues>({
    resolver: zodResolver(blockSchema),
    defaultValues: getDefaults(block),
  });

  useEffect(() => {
    reset(getDefaults(block));
  }, [block, reset]);

  const type = watch('type');

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-10">
      <div className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl dark:bg-gray-900">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {block ? t('editTitle') : t('createTitle')}
            </h2>
            <p className="text-sm text-muted-foreground">{t('modalDescription')}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-border px-3 py-2 text-sm font-medium transition hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={t('close')}
          >
            ×
          </button>
        </div>

        <form
          className="space-y-4"
          onSubmit={handleSubmit(async (values) => {
            try {
              await onSubmit(values);
              onClose();
            } catch {
              setError('root', { message: 'request_failed' });
            }
          })}
        >
          <label className="block text-sm font-medium text-gray-900 dark:text-white">
            <span>{t('fields.type')}</span>
            <select
              {...register('type')}
              className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="link">{t('types.link')}</option>
              <option value="social">{t('types.social')}</option>
              <option value="contact">{t('types.contact')}</option>
            </select>
          </label>

          <label className="block text-sm font-medium text-gray-900 dark:text-white">
            <span>{t('fields.label')}</span>
            <input
              type="text"
              {...register('label')}
              className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
            />
          </label>

          {type === 'link' || type === 'social' ? (
            <label className="block text-sm font-medium text-gray-900 dark:text-white">
              <span>{t('fields.url')}</span>
              <input
                type="url"
                {...register('url')}
                className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
              />
            </label>
          ) : null}

          {type === 'social' ? (
            <label className="block text-sm font-medium text-gray-900 dark:text-white">
              <span>{t('fields.platform')}</span>
              <select
                {...register('brand')}
                className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
              >
                {SOCIAL_PLATFORMS.map((platform) => (
                  <option key={platform} value={platform}>
                    {platform}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          {type === 'contact' ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-medium text-gray-900 dark:text-white">
                <span>{t('fields.contactType')}</span>
                <select
                  {...register('contactType')}
                  className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {CONTACT_TYPES.map((contactType) => (
                    <option key={contactType} value={contactType}>
                      {t(`contactTypes.${contactType}`)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm font-medium text-gray-900 dark:text-white">
                <span>{t('fields.contactValue')}</span>
                <input
                  type="text"
                  {...register('contactValue')}
                  className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
                />
              </label>
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-medium text-gray-900 dark:text-white">
              <span>{t('fields.visibleFrom')}</span>
              <input
                type="datetime-local"
                {...register('visibleFrom')}
                className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
              />
            </label>
            <label className="block text-sm font-medium text-gray-900 dark:text-white">
              <span>{t('fields.visibleUntil')}</span>
              <input
                type="datetime-local"
                {...register('visibleUntil')}
                className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
              />
            </label>
          </div>

          <label className="flex items-center gap-3 text-sm font-medium text-gray-900 dark:text-white">
            <input type="checkbox" {...register('isActive')} className="h-4 w-4 rounded border-border" />
            <span>{t('fields.isActive')}</span>
          </label>

          {errors.root?.message ? <p className="text-sm text-red-600">{t('requestError')}</p> : null}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-border px-4 py-3 text-sm font-medium transition hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? t('saving') : block ? t('saveChanges') : t('create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
