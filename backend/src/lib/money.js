// All USD amounts are stored as integer cents; share quantities as integer micro-shares (1e-6).
export const MICRO = 1_000_000;

export const toCents = (usd) => Math.round(Number(usd) * 100);
export const fromCents = (cents) => Math.round(cents) / 100;
export const toMicro = (shares) => Math.round(Number(shares) * MICRO);
export const fromMicro = (micro) => Math.round(micro) / MICRO;

/** Parse a user-supplied USD amount. Returns cents or null when invalid. */
export function parseUsd(value) {
  const n = typeof value === 'string' ? Number(value.replace(/[,$\s]/g, '')) : Number(value);
  if (!Number.isFinite(n) || n <= 0) return null;
  if (Math.abs(n * 100 - Math.round(n * 100)) > 1e-6) return null; // more than 2 decimals
  return Math.round(n * 100);
}
