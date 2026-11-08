import { BY_SYMBOL } from '../seed/stocks.js';
import { gaussian, hashString, prng } from './random.js';

// Deterministic simulated market. The same symbol and timestamp always give the same price, so
// every client sees a consistent tape without a market-data feed. The close on the anchor day
// equals the stock's reference price in seed/stocks.js.
const DAY = 86_400_000;
const ANCHOR_DAY = Math.floor(Date.UTC(2026, 10, 1) / DAY);
const START_DAY = ANCHOR_DAY - 800;
const DRIFT = 0.0003;

const walkCache = new Map(); // symbol -> cumulative log return per day since START_DAY

function dailyReturn(stock, day) {
  return gaussian(prng(hashString(`${stock.symbol}:${day}`))) * stock.vol + DRIFT;
}

function walk(stock, day) {
  let arr = walkCache.get(stock.symbol);
  if (!arr) walkCache.set(stock.symbol, (arr = [0]));
  const idx = Math.max(0, day - START_DAY);
  while (arr.length <= idx) arr.push(arr[arr.length - 1] + dailyReturn(stock, START_DAY + arr.length));
  return arr[idx];
}

/** Cumulative log return from the anchor close to the close of `day` (negative days walk back). */
function logClose(stock, day) {
  return walk(stock, day) - walk(stock, ANCHOR_DAY);
}

export function priceAt(symbol, t = Date.now()) {
  const stock = BY_SYMBOL[symbol];
  if (!stock) return null;
  const day = Math.floor(t / DAY);
  const progress = (t - day * DAY) / DAY;
  const prev = logClose(stock, day - 1);
  const r = dailyReturn(stock, day);
  const seed = hashString(stock.symbol) % 1000;
  const wiggle = 0.35 * stock.vol * Math.sin(Math.PI * progress) * Math.sin(t / 420_000 + seed);
  const price = stock.base * Math.exp(prev + r * progress + wiggle);
  return Math.round(price * 100) / 100;
}

export function simQuote(symbol, t = Date.now()) {
  const price = priceAt(symbol, t);
  if (price == null) return null;
  const prevClose = priceAt(symbol, Math.floor(t / DAY) * DAY);
  const change = Math.round((price - prevClose) * 100) / 100;
  return {
    symbol,
    price,
    prevClose,
    change,
    changePct: prevClose ? change / prevClose : 0,
    asOf: new Date(t).toISOString(),
    source: 'sandbox',
  };
}

export const RANGES = {
  '1D': { span: DAY, step: 10 * 60_000 },
  '1W': { span: 7 * DAY, step: 2 * 3_600_000 },
  '1M': { span: 30 * DAY, step: DAY / 2 },
  '3M': { span: 91 * DAY, step: DAY },
  '1Y': { span: 365 * DAY, step: 3 * DAY },
};

export function history(symbol, range = '1M', now = Date.now()) {
  const cfg = RANGES[range];
  if (!cfg || !BY_SYMBOL[symbol]) return null;
  const points = [];
  for (let t = now - cfg.span; t < now; t += cfg.step) points.push({ t, p: priceAt(symbol, t) });
  points.push({ t: now, p: priceAt(symbol, now) });
  return points;
}

// ---- Plain-language explainers -------------------------------------------------------------

export function riskScore(stock) {
  return Math.max(1, Math.min(10, Math.round(stock.vol * 250)));
}

export function explain(stock) {
  const risk = riskScore(stock);
  const riskLabel = risk <= 3 ? 'Low' : risk <= 6 ? 'Medium' : risk <= 8 ? 'High' : 'Very high';
  const cap = stock.marketCap;
  const capText =
    cap >= 1e12 ? 'One of the largest companies on earth.'
    : cap >= 2e11 ? 'A household-name giant.'
    : cap >= 1e10 ? 'A well-established, mid-to-large company.'
    : 'A smaller company: more room to grow, and more room to fall.';
  const g = stock.revenueGrowth;
  const growthText =
    g >= 0.25 ? 'Sales are growing very fast.'
    : g >= 0.1 ? 'Sales are growing faster than most big companies.'
    : g >= 0 ? 'Sales are growing slowly and steadily.'
    : 'Sales shrank compared with last year.';
  const move = (stock.vol * 100).toFixed(1);
  const dividendText = stock.dividendYield > 0
    ? `Pays about $${(stock.dividendYield * 100).toFixed(2)} a year for every $100 invested.`
    : 'Does not pay a dividend; profits are reinvested in the business.';
  return {
    marketCap: { value: cap, text: capText },
    revenueGrowth: { value: g, text: growthText },
    risk: { score: risk, label: riskLabel, text: `On a typical day the price moves about ±${move}%.` },
    dividend: { value: stock.dividendYield, text: dividendText },
  };
}
