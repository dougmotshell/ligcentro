import type { BlockType } from '@/lib/db/types';

export const BLOCK_TYPES = ['link', 'social', 'contact'] as const;
export const SOCIAL_PLATFORMS = ['twitter', 'instagram', 'linkedin', 'github', 'youtube', 'tiktok'] as const;
export const CONTACT_TYPES = ['whatsapp', 'email', 'phone'] as const;

export interface BlockPayloadInput {
  type: BlockType;
  label?: string | null;
  url?: string | null;
  brand?: string | null;
  contactType?: string | null;
  contactValue?: string | null;
  visibleFrom?: string | null;
  visibleUntil?: string | null;
  isActive?: boolean;
}

export interface NormalizedBlockPayload {
  type: BlockType;
  label: string;
  url: string;
  config: Record<string, unknown>;
  visible_from: string | null;
  visible_until: string | null;
  is_active: boolean;
}

function assertUrl(value: string): string {
  try {
    const url = new URL(value);

    if (!['http:', 'https:'].includes(url.protocol)) {
      throw new Error();
    }

    return url.toString();
  } catch {
    throw new Error('invalid_url');
  }
}

function normalizeDate(value?: string | null): string | null {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    throw new Error('invalid_schedule');
  }

  return parsed.toISOString();
}

function buildContactUrl(contactType: string, rawValue: string): string {
  if (contactType === 'email') {
    if (!rawValue.includes('@')) {
      throw new Error('invalid_contact');
    }

    return `mailto:${rawValue}`;
  }

  const normalized = rawValue.replace(/[^\d+]/g, '');

  if (!normalized) {
    throw new Error('invalid_contact');
  }

  if (contactType === 'phone') {
    return `tel:${normalized}`;
  }

  if (contactType === 'whatsapp') {
    return `https://wa.me/${normalized.replace(/\+/g, '')}`;
  }

  throw new Error('invalid_contact');
}

export function normalizeBlockInput(input: BlockPayloadInput): NormalizedBlockPayload {
  const type = input.type;
  const label = input.label?.trim() || '';
  const visibleFrom = normalizeDate(input.visibleFrom);
  const visibleUntil = normalizeDate(input.visibleUntil);

  if (visibleFrom && visibleUntil && visibleFrom > visibleUntil) {
    throw new Error('invalid_schedule');
  }

  if (type === 'link') {
    if (!label) {
      throw new Error('missing_label');
    }

    return {
      type,
      label,
      url: assertUrl(input.url?.trim() || ''),
      config: {},
      visible_from: visibleFrom,
      visible_until: visibleUntil,
      is_active: input.isActive ?? true,
    };
  }

  if (type === 'social') {
    const brand = input.brand?.trim().toLowerCase() || '';

    if (!SOCIAL_PLATFORMS.includes(brand as (typeof SOCIAL_PLATFORMS)[number])) {
      throw new Error('invalid_social');
    }

    return {
      type,
      label: label || brand.charAt(0).toUpperCase() + brand.slice(1),
      url: assertUrl(input.url?.trim() || ''),
      config: { brand },
      visible_from: visibleFrom,
      visible_until: visibleUntil,
      is_active: input.isActive ?? true,
    };
  }

  if (type === 'contact') {
    const contactType = input.contactType?.trim().toLowerCase() || '';
    const contactValue = input.contactValue?.trim() || '';

    if (!CONTACT_TYPES.includes(contactType as (typeof CONTACT_TYPES)[number])) {
      throw new Error('invalid_contact');
    }

    return {
      type,
      label: label || contactType.charAt(0).toUpperCase() + contactType.slice(1),
      url: buildContactUrl(contactType, contactValue),
      config: { type: contactType, value: contactValue },
      visible_from: visibleFrom,
      visible_until: visibleUntil,
      is_active: input.isActive ?? true,
    };
  }

  throw new Error('invalid_type');
}
