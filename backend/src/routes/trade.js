import { Router } from 'express';
import { badRequest } from '../lib/errors.js';
import { parseUsd } from '../lib/money.js';

export default function tradeRoutes({ db, ledger, requireUser }) {
  const r = Router();

  r.post('/orders', requireUser, async (req, res) => {
    const { symbol, side, amount, all } = req.body ?? {};
    const sellAll = side === 'sell' && all === true;
    const notionalCents = sellAll ? null : parseUsd(amount);
    if (!sellAll && !notionalCents) throw badRequest('invalid_amount', 'Enter a dollar amount, from $1.');
    const order = await ledger.placeOrder(req.user, { symbol: String(symbol ?? '').toUpperCase(), side, notionalCents, all: sellAll });
    res.status(201).json({ order });
  });

  r.get('/orders', requireUser, (req, res) => {
    const orders = db.state.orders.filter((o) => o.userId === req.user.id).slice(-50).reverse();
    res.json({ orders: orders.map(({ userId, ...o }) => ({ ...o, notional: o.notionalCents / 100 })) });
  });

  r.get('/portfolio', requireUser, async (req, res) => {
    res.json({ portfolio: await ledger.portfolio(req.user) });
  });

  return r;
}
