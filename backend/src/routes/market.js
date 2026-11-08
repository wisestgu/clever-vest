import { Router } from 'express';
import { notFound } from '../lib/errors.js';
import { RANGES } from '../lib/prices.js';
import { insiderFeed } from '../providers/fmp.js';
import { BY_SYMBOL, COLLECTIONS } from '../seed/stocks.js';
import { listing, quotes, search, snapshot } from '../services/market.js';

export default function marketRoutes() {
  const r = Router();

  r.get('/feed', async (_req, res) => {
    const insiders = await insiderFeed();
    const qs = await quotes([...new Set(insiders.map((i) => i.symbol))]);
    res.json({
      insiders: insiders.map((i) => ({ ...i, name: BY_SYMBOL[i.symbol].name, quote: qs[i.symbol] ?? null })),
      source: insiders[0]?.source ?? 'sample',
    });
  });

  r.get('/collections', async (_req, res) => {
    const symbols = [...new Set(COLLECTIONS.flatMap((c) => c.symbols))];
    const qs = await quotes(symbols);
    res.json({
      collections: COLLECTIONS.map((c) => ({ ...c, stocks: c.symbols.map((s) => listing(BY_SYMBOL[s], qs[s])) })),
    });
  });

  r.get('/collections/:id', async (req, res) => {
    const c = COLLECTIONS.find((x) => x.id === req.params.id);
    if (!c) throw notFound('That collection doesn’t exist.');
    const qs = await quotes(c.symbols);
    res.json({ collection: { ...c, stocks: c.symbols.map((s) => listing(BY_SYMBOL[s], qs[s])) } });
  });

  r.get('/search', async (req, res) => {
    const found = search(String(req.query.q ?? '')).slice(0, 20);
    const qs = await quotes(found.map((s) => s.symbol));
    res.json({ results: found.map((s) => listing(s, qs[s.symbol])) });
  });

  r.get('/stocks/:symbol', async (req, res) => {
    const range = RANGES[req.query.range] ? req.query.range : '1M';
    const snap = await snapshot(String(req.params.symbol).toUpperCase(), range);
    if (!snap) throw notFound('We don’t support that stock yet.');
    res.json({ stock: snap });
  });

  return r;
}
