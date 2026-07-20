import type { CSSProperties, ComponentType } from 'react';
import {
  FaFacebook,
  FaGithub,
  FaInstagram,
  FaLink,
  FaLinkedin,
  FaTiktok,
  FaTwitter,
  FaYoutube,
} from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';
import { getSafeExternalUrl } from '@/lib/safe-url';
import type { Block, ThemeConfig } from '@/lib/db/types';

const SOCIAL_ICONS: Record<string, ComponentType<{ className?: string }>> = {
  instagram: FaInstagram,
  twitter: FaTwitter,
  x: FaXTwitter,
  youtube: FaYoutube,
  github: FaGithub,
  tiktok: FaTiktok,
  linkedin: FaLinkedin,
  facebook: FaFacebook,
};

interface Props {
  block: Block;
  theme?: ThemeConfig;
}

export function BlockSocial({ block, theme }: Props) {
  const url = getSafeExternalUrl(block.url);

  if (!url) {
    return null;
  }

  const brand = typeof block.config.brand === 'string' ? block.config.brand : 'link';
  const Icon = SOCIAL_ICONS[brand] ?? FaLink;
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
      aria-label={block.label ?? brand}
    >
      <Icon className="h-5 w-5" aria-hidden="true" />
      <span>{block.label ?? brand}</span>
    </a>
  );
}
