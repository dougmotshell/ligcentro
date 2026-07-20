'use client';

import { useEffect } from 'react';
import { trackView } from '@/lib/analytics/client';

interface Props {
  profileId: string;
}

export function AnalyticsTracker({ profileId }: Props) {
  useEffect(() => {
    trackView(profileId);
  }, [profileId]);

  return null;
}
