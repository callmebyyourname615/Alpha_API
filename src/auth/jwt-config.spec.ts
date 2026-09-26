import { normalizeJwtExpiresIn } from './jwt-config';

describe('normalizeJwtExpiresIn', () => {
  it('uses 30 minutes by default', () => {
    expect(normalizeJwtExpiresIn()).toBe('30m');
    expect(normalizeJwtExpiresIn('')).toBe('30m');
  });

  it('treats a unitless environment value as minutes', () => {
    expect(normalizeJwtExpiresIn('30')).toBe('30m');
    expect(normalizeJwtExpiresIn(' 60 ')).toBe('60m');
  });

  it('preserves an explicit duration unit', () => {
    expect(normalizeJwtExpiresIn('45m')).toBe('45m');
    expect(normalizeJwtExpiresIn('8h')).toBe('8h');
  });
});
