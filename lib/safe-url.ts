const allowedProtocols = new Set(['http:', 'https:']);

export function getSafeExternalUrl(value: string | null): string | null {
  if (!value) {
    return null;
  }

  if (value.startsWith('mailto:') || value.startsWith('tel:')) {
    return value;
  }

  try {
    const url = new URL(value);
    return allowedProtocols.has(url.protocol) ? url.toString() : null;
  } catch {
    return null;
  }
}

export function getSafeImageUrl(value: string | null): string | null {
  if (!value) {
    return null;
  }

  if (value.startsWith('/')) {
    return value;
  }

  try {
    const url = new URL(value);
    return allowedProtocols.has(url.protocol) ? url.toString() : null;
  } catch {
    return null;
  }
}
