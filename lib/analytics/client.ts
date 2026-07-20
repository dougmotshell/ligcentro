export function trackView(profileId: string): void {
  if (typeof navigator === 'undefined') {
    return;
  }

  navigator.sendBeacon('/api/analytics/view', JSON.stringify({ profileId }));
}

export function trackClick(blockId: string, profileId: string): void {
  if (typeof navigator === 'undefined') {
    return;
  }

  navigator.sendBeacon('/api/analytics/click', JSON.stringify({ blockId, profileId }));
}
