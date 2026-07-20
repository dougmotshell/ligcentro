const RESERVED = [
  'admin',
  'api',
  'login',
  'signup',
  'dashboard',
  'settings',
  'me',
  'help',
  'terms',
  'privacy',
  'about',
  'pricing',
  'blog',
  'demo',
];

const REGEX = /^[a-z0-9_-]{3,30}$/;

export function validateHandle(handle: string): { valid: boolean; error?: string } {
  const normalizedHandle = handle.trim().toLowerCase();

  if (!normalizedHandle) {
    return { valid: false, error: 'required' };
  }

  if (normalizedHandle.length < 3 || normalizedHandle.length > 30) {
    return { valid: false, error: 'length' };
  }

  if (!REGEX.test(normalizedHandle)) {
    return { valid: false, error: 'format' };
  }

  if (RESERVED.includes(normalizedHandle)) {
    return { valid: false, error: 'reserved' };
  }

  return { valid: true };
}

export function normalizeHandle(handle: string): string {
  return handle.trim().toLowerCase();
}
