import type { Block } from '@/lib/db/types';
import { getSafeExternalUrl } from '@/lib/safe-url';

interface Props {
  block: Block;
}

export function BlockLink({ block }: Props) {
  const url = getSafeExternalUrl(block.url);

  if (!url) {
    return null;
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="block w-full rounded-xl border border-gray-200 bg-white px-6 py-3 text-center font-medium text-gray-900 shadow-sm transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
    >
      {block.label ?? url}
    </a>
  );
}
