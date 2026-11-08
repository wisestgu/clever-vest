import { BY_SYMBOL } from './stocks.js';
import { hashString, prng } from '../lib/random.js';
import { priceAt } from '../lib/prices.js';

// Synthetic insider filings for sandbox mode. They are generated relative to today so the feed
// always looks fresh, and are labelled "sample" in the API and UI: they are NOT real Form 4 filings.
const TEMPLATES = [
  { symbol: 'NVDA', role: 'Director', type: 'buy', usd: 1_250_000, daysAgo: 1 },
  { symbol: 'TSLA', role: 'Chief Executive Officer', type: 'buy', usd: 2_100_000, daysAgo: 2 },
  { symbol: 'KO', role: 'Chief Financial Officer', type: 'buy', usd: 310_000, daysAgo: 3 },
  { symbol: 'META', role: 'Chief Operating Officer', type: 'sell', usd: 4_800_000, daysAgo: 3 },
  { symbol: 'ENPH', role: 'Chief Executive Officer', type: 'buy', usd: 520_000, daysAgo: 4 },
  { symbol: 'AAPL', role: 'Senior Vice President', type: 'sell', usd: 6_200_000, daysAgo: 5 },
  { symbol: 'PLTR', role: 'Director', type: 'buy', usd: 180_000, daysAgo: 6 },
  { symbol: 'O', role: 'Director', type: 'buy', usd: 95_000, daysAgo: 7 },
  { symbol: 'AMD', role: 'Chief Technology Officer', type: 'sell', usd: 1_900_000, daysAgo: 8 },
  { symbol: 'NEE', role: 'Chief Executive Officer', type: 'buy', usd: 740_000, daysAgo: 9 },
];

const fmtUsd = (n) => (n >= 1e6 ? `$${(n / 1e6).toFixed(1)}M` : `$${Math.round(n / 1000)}K`);

const ROLE_SHORT = { 'Chief Executive Officer': 'CEO', 'Chief Financial Officer': 'CFO', 'Chief Operating Officer': 'COO', 'Chief Technology Officer': 'CTO' };

export function summarize({ symbol, role, type, value }) {
  const name = BY_SYMBOL[symbol]?.name ?? symbol;
  const short = ROLE_SHORT[role];
  const lower = role.toLowerCase();
  const who = short ? `${name}’s ${short}` : `${/^[aeiou]/.test(lower) ? 'An' : 'A'} ${lower} at ${name}`;
  if (type === 'buy') {
    return {
      headline: `${who} bought ${fmtUsd(value)} of ${name} stock`,
      meaning: 'Insiders usually buy with their own money when they expect the price to rise. It is a clue, not a guarantee.',
    };
  }
  return {
    headline: `${who} sold ${fmtUsd(value)} of ${name} stock`,
    meaning: 'Insiders sell for many personal reasons, so a single sale is a weaker signal than a purchase.',
  };
}

export function sampleInsiderFeed(now = Date.now()) {
  return TEMPLATES.map((tpl, i) => {
    const t = now - tpl.daysAgo * 86_400_000 - (hashString(tpl.symbol) % 36_000_000);
    const price = priceAt(tpl.symbol, t);
    const jitter = 0.85 + prng(hashString(`${tpl.symbol}:${i}`))() * 0.3;
    const value = Math.round(tpl.usd * jitter);
    const shares = Math.round(value / price);
    const trade = {
      id: `ins_${tpl.symbol}_${i}`,
      symbol: tpl.symbol,
      role: tpl.role,
      type: tpl.type,
      shares,
      price,
      value,
      filedAt: new Date(t).toISOString(),
      source: 'sample',
    };
    return { ...trade, ...summarize(trade) };
  });
}
