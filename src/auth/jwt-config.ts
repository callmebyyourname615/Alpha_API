const DEFAULT_JWT_EXPIRES_IN = '30m';

/**
 * jsonwebtoken treats a unitless string such as "30" as milliseconds.
 * Environment variables are always strings, so keep backward compatibility
 * by interpreting a digits-only value as minutes.
 */
export const normalizeJwtExpiresIn = (value?: string): string => {
  const normalized = String(value || '').trim();

  if (!normalized) {
    return DEFAULT_JWT_EXPIRES_IN;
  }

  return /^\d+$/.test(normalized) ? `${normalized}m` : normalized;
};

