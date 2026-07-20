import {
  FaEnvelope,
  FaPhone,
  FaWhatsapp,
} from 'react-icons/fa';
import type { ComponentType } from 'react';
import { getSafeExternalUrl } from '@/lib/safe-url';
import type { Block } from '@/lib/db/types';

const CONTACT_ICONS: Record<string, ComponentType<{ className?: string }>> = {
  whatsapp: FaWhatsapp,
  email: FaEnvelope,
  phone: FaPhone,
};

const CONTACT_COLORS: Record<string, string> = {
  whatsapp: 'bg-green-500',
  email: 'bg-blue-500',
  phone: 'bg-gray-600',
};

interface Props {
  block: Block;
}

export function BlockContact({ block }: Props) {
  const url = getSafeExternalUrl(block.url);

  if (!url) {
    return null;
  }

  const contactType = typeof block.config.type === 'string' ? block.config.type : 'email';
  const Icon = CONTACT_ICONS[contactType] ?? FaEnvelope;
  const colorClass = CONTACT_COLORS[contactType] ?? 'bg-gray-600';

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex w-full items-center justify-center gap-3 rounded-xl px-6 py-3 font-medium text-white shadow-sm transition-opacity hover:opacity-90 ${colorClass}`}
      aria-label={block.label ?? contactType}
    >
      <Icon className="h-5 w-5" aria-hidden="true" />
      <span>{block.label ?? contactType}</span>
    </a>
  );
}
