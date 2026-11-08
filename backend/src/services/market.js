import * as alpaca from '../providers/alpaca.js';
import { BY_SYMBOL, COLLECTIONS, STOCKS } from '../seed/stocks.js';
import { explain, history, riskScore, simQuote } from '../lib/prices.js';

export async function quote(symbol) {
  if (!BY_SYMBOL[symbol]) return null;
  if (alpaca.enabled) {
    try {
      return await alpaca.quote(symbol);
    } catch (err) {
      console.warn(`[alpaca] quote fallback for ${symbol}: ${err.message}`);
    }
  }
  return simQuote(symbol);
}

export async function quotes(symbols) {
  const out = await Promise.all(symbols.map((s) => quote(s)));
  return Object.fromEntries(out.filter(Boolean).map((q) => [q.symbol, q]));
}

export function listing(stock, q) {
  return {
    symbol: stock.symbol,
    name: stock.name,
    sector: stock.sector,
    price: q?.price ?? null,
    change: q?.change ?? null,
    changePct: q?.changePct ?? null,
    risk: riskScore(stock),
  };
}

export async function snapshot(symbol, range = '1M') {
  const stock = BY_SYMBOL[symbol];
  if (!stock) return null;
  const q = await quote(symbol);
  let points = history(symbol, range);
  // When live quotes are on, rescale the simulated chart so it ends at the real price.
  if (q?.source === 'alpaca' && points?.length) {
    const k = q.price / points[points.length - 1].p;
    points = points.map((pt) => ({ t: pt.t, p: Math.round(pt.p * k * 100) / 100 }));
  }
  const collections = COLLECTIONS.filter((c) => c.symbols.includes(symbol)).map(({ id, name }) => ({ id, name }));
  return { ...listing(stock, q), about: stock.about, quote: q, range, history: points, explain: explain(stock), collections };
}

export function search(term) {
  const t = term.trim().toLowerCase();
  if (!t) return STOCKS;
  return STOCKS.filter((s) => s.symbol.toLowerCase().startsWith(t) || s.name.toLowerCase().includes(t) || s.sector.toLowerCase().includes(t));
}
