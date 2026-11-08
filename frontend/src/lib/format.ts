const usd2 = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 });
const ngn0 = new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', currencyDisplay: 'narrowSymbol', maximumFractionDigits: 0 });
const ngn2 = new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', currencyDisplay: 'narrowSymbol', minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const usd = (n: number) => usd2.format(n);
export const ngn = (n: number, cents = false) => (cents ? ngn2 : ngn0).format(n);

export const signedUsd = (n: number) => `${n > 0 ? '+' : n < 0 ? '−' : ''}${usd2.format(Math.abs(n))}`;

export function pct(n: number, signed = true) {
  const v = (Math.abs(n) * 100).toFixed(2);
  if (!signed) return `${v}%`;
  return `${n > 0 ? '+' : n < 0 ? '−' : ''}${v}%`;
}

export function shares(n: number) {
  if (n >= 1) return n.toLocaleString('en-US', { maximumFractionDigits: 4 });
  return n.toLocaleString('en-US', { maximumSignificantDigits: 4 });
}

export function compactUsd(n: number) {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e4) return `$${Math.round(n / 1e3)}K`;
  return usd(n);
}

export const tone = (n: number | null | undefined) => (n == null || n === 0 ? '' : n > 0 ? 'gain' : 'loss');

export function relativeDay(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const start = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = Math.round((start(today) - start(d)) / 86_400_000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  return d.toLocaleDateString('en-NG', { weekday: diff < 7 ? 'long' : undefined, day: 'numeric', month: 'short' });
}

export const time = (iso: string) => new Date(iso).toLocaleTimeString('en-NG', { hour: 'numeric', minute: '2-digit' });

export const initials = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');

export function shortAddress(a: string) {
  return a.length > 16 ? `${a.slice(0, 8)}…${a.slice(-6)}` : a;
}
