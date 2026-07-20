'use client';

import type { ReactNode } from 'react';
import { trackClick } from '@/lib/analytics/client';

interface Props {
  blockId: string;
  profileId: string;
  children: ReactNode;
}

export function BlockClickTracker({ blockId, profileId, children }: Props) {
  return <div onClickCapture={() => trackClick(blockId, profileId)}>{children}</div>;
}
