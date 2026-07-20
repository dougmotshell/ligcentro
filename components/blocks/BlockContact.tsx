import type { CSSProperties, ComponentType } from 'react';
import { FaEnvelope, FaPhone, FaWhatsapp } from 'react-icons/fa';
import { getSafeExternalUrl } from '@/lib/safe-url';
import type { Block, ThemeConfig } from '@/lib/db/types';

const CONTACT_ICONS: Record<string, ComponentType<{ className?: string }>> = {
  whatsapp: FaWhatsapp,
  email: FaEnvelope,
  phone: FaPhone,
};

interface Props {
  block: Block;
  theme?: ThemeConfig;
}

export function BlockContact({ block, theme }: Props) {
  const url = getSafeExternalUrl(block.url);

  if (!url) {
    return null;
  }

  const contactType = typeof block.config.type === 'string' ? block.config.type : 'email';
  const Icon = CONTACT_ICONS[contactType] ?? FaEnvelope;
  const style: CSSProperties | undefined = theme
    ? {
        backgroundColor: theme.btnBg,
        color: theme.btnText,
      }
    : undefined;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      style={style}
      className="flex w-full items-center justify-center gap-3 rounded-xl border border-transparent px-6 py-3 font-medium shadow-sm transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      aria-label={block.label ?? contactType}
    >
      <Icon className="h-5 w-5" aria-hidden="true" />
      <span>{block.label ?? contactType}</span>
    </a>
  );
}
