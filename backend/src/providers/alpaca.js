// Alpaca (licensed US broker-dealer) adapter. Dollo is the UX and order-routing layer; execution
// and custody sit with the broker. When ALPACA_KEY_ID/ALPACA_SECRET_KEY are set, quotes come from
// Alpaca market data and orders are routed to the Alpaca paper-trading API. Otherwise everything
// runs against the deterministic sandbox market in lib/prices.js.

const KEY = process.env.ALPACA_KEY_ID;
const SECRET = process.env.ALPACA_SECRET_KEY;
const TRADING = process.env.ALPACA_TRADING_URL || 'https://paper-api.alpaca.markets';
const DATA = process.env.ALPACA_DATA_URL || 'https://data.alpaca.markets';

export const enabled = Boolean(KEY && SECRET);
export const mode = enabled ? 'alpaca-paper' : 'sandbox';

const headers = () => ({ 'APCA-API-KEY-ID': KEY, 'APCA-API-SECRET-KEY': SECRET, 'content-type': 'application/json' });

const cache = new Map();

export async function quote(symbol) {
  const hit = cache.get(symbol);
  if (hit && Date.now() - hit.at < 15_000) return hit.value;
  const res = await fetch(`${DATA}/v2/stocks/${encodeURIComponent(symbol)}/snapshot`, {
    headers: headers(),
    signal: AbortSignal.timeout(4000),
  });
  if (!res.ok) throw new Error(`alpaca snapshot ${res.status}`);
  const snap = await res.json();
  const price = snap.latestTrade?.p ?? snap.minuteBar?.c;
  const prevClose = snap.prevDailyBar?.c ?? price;
  if (!price) throw new Error('alpaca snapshot missing price');
  const change = Math.round((price - prevClose) * 100) / 100;
  const value = { symbol, price, prevClose, change, changePct: prevClose ? change / prevClose : 0, asOf: snap.latestTrade?.t ?? new Date().toISOString(), source: 'alpaca' };
  cache.set(symbol, { at: Date.now(), value });
  return value;
}

/** Routes a notional (dollar-amount) market order. Alpaca supports fractional orders from $1. */
export async function placeOrder({ symbol, side, notionalUsd, clientOrderId }) {
  const res = await fetch(`${TRADING}/v2/orders`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ symbol, side, type: 'market', time_in_force: 'day', notional: notionalUsd.toFixed(2), client_order_id: clientOrderId }),
    signal: AbortSignal.timeout(6000),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.message || `alpaca order ${res.status}`);
  return { brokerOrderId: body.id, brokerStatus: body.status };
}
