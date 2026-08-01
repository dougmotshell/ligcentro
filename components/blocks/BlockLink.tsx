import type { CSSProperties } from 'react';
import type { Block, ThemeConfig } from '@/lib/db/types';
import { getSafeExternalUrl } from '@/lib/safe-url';
import { getButtonStyle } from '@/lib/theme/presets';

interface Props {
  block: Block;
  theme?: ThemeConfig;
}

export function BlockLink({ block, theme }: Props) {
  const url = getSafeExternalUrl(block.url);

  if (!url) {
    return null;
  }

  const style: CSSProperties | undefined = getButtonStyle(theme);

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      style={style}
      className="block w-full border border-gray-200 px-6 py-3 text-center font-medium shadow-sm transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:border-gray-700"
    >
      {block.label ?? url}
    </a>
  );
}
