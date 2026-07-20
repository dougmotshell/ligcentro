import type { ComponentType } from 'react';
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
import type { Block } from '@/lib/db/types';

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

const SOCIAL_COLORS: Record<string, string> = {
  instagram: 'bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400',
  twitter: 'bg-sky-500',
  x: 'bg-black',
  youtube: 'bg-red-600',
  github: 'bg-gray-900',
  tiktok: 'bg-black',
  linkedin: 'bg-blue-700',
  facebook: 'bg-blue-600',
};

interface Props {
  block: Block;
}

export function BlockSocial({ block }: Props) {
  const url = getSafeExternalUrl(block.url);

  if (!url) {
    return null;
  }

  const brand = typeof block.config.brand === 'string' ? block.config.brand : 'link';
  const Icon = SOCIAL_ICONS[brand] ?? FaLink;
  const colorClass = SOCIAL_COLORS[brand] ?? 'bg-gray-600';

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex w-full items-center justify-center gap-3 rounded-xl px-6 py-3 font-medium text-white shadow-sm transition-opacity hover:opacity-90 ${colorClass}`}
      aria-label={block.label ?? brand}
    >
      <Icon className="h-5 w-5" aria-hidden="true" />
      <span>{block.label ?? brand}</span>
    </a>
  );
}
