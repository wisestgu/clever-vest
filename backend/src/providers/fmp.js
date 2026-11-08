import { BY_SYMBOL } from '../seed/stocks.js';
import { sampleInsiderFeed, summarize } from '../seed/insiders.js';

// Financial Modeling Prep insider-trading feed. With FMP_API_KEY set, Dollo pulls the latest
// Form 4 filings and rewrites them in plain English; on any failure, or with no key, it serves
// the clearly labelled sample feed instead.

const KEY = process.env.FMP_API_KEY;
export const mode = KEY ? 'fmp' : 'sandbox';

let cached = null;

export async function insiderFeed() {
  if (!KEY) return sampleInsiderFeed();
  if (cached && Date.now() - cached.at < 10 * 60_000) return cached.items;
  try {
    const url = `https://financialmodelingprep.com/stable/insider-trading/latest?page=0&limit=200&apikey=${encodeURIComponent(KEY)}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) throw new Error(`fmp ${res.status}`);
    const rows = await res.json();
    const items = rows
      .filter((r) => BY_SYMBOL[r.symbol] && /^(P|S)-/.test(r.transactionType || '') && r.price > 0)
      .slice(0, 20)
      .map((r, i) => {
        const trade = {
          id: `fmp_${r.symbol}_${i}`,
          symbol: r.symbol,
          role: (r.typeOfOwner || 'insider').replace(/^officer:\s*/i, ''),
          type: r.transactionType.startsWith('P') ? 'buy' : 'sell',
          shares: r.securitiesTransacted,
          price: r.price,
          value: Math.round(r.securitiesTransacted * r.price),
          filedAt: new Date(r.filingDate || r.transactionDate).toISOString(),
          source: 'fmp',
        };
        return { ...trade, ...summarize(trade) };
      });
    if (!items.length) throw new Error('fmp returned no matching filings');
    cached = { at: Date.now(), items };
    return items;
  } catch (err) {
    console.warn(`[fmp] falling back to sample insider feed: ${err.message}`);
    return sampleInsiderFeed();
  }
}
