// Indicative USD/NGN rate used for withdrawals and naira equivalents. In sandbox mode the rate
// drifts gently around FX_USD_NGN so quotes visibly refresh; a production build would source it
// from Cleva's quote endpoint at the moment of withdrawal.

const BASE = Number(process.env.FX_USD_NGN || 1520);
export const FEE_PCT = Number(process.env.WITHDRAWAL_FEE_PCT ?? 1) / 100;
export const FEE_MIN_CENTS = Math.round(Number(process.env.WITHDRAWAL_FEE_MIN_USD ?? 0.5) * 100);
export const QUOTE_TTL_MS = 60_000;

export function usdNgn(t = Date.now()) {
  const rate = BASE * (1 + 0.004 * Math.sin(t / 3_600_000) + 0.0015 * Math.sin(t / 240_000));
  return { pair: 'USD/NGN', rate: Math.round(rate * 100) / 100, asOf: new Date(t).toISOString(), source: 'sandbox' };
}

export function withdrawalFeeCents(amountCents) {
  return Math.max(FEE_MIN_CENTS, Math.round(amountCents * FEE_PCT));
}
