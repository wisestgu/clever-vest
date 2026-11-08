import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { createDb } from './db.js';
import { errorHandler, unauthorized } from './lib/errors.js';
import { createLedger } from './services/ledger.js';
import { createUsers } from './services/users.js';
import authRoutes from './routes/auth.js';
import walletRoutes from './routes/wallet.js';
import marketRoutes from './routes/market.js';
import tradeRoutes from './routes/trade.js';
import learnRoutes from './routes/learn.js';
import * as alpaca from './providers/alpaca.js';
import * as cleva from './providers/cleva.js';
import * as fmp from './providers/fmp.js';

export function createApp({ db = createDb(), seedDemo = true } = {}) {
  const users = createUsers(db);
  const ledger = createLedger(db);
  if (seedDemo) users.ensureDemo();

  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '32kb' }));

  /** Resolve the bearer token; protected routers call `requireUser`. */
  app.use((req, _res, next) => {
    const header = req.get('authorization') || '';
    req.token = header.startsWith('Bearer ') ? header.slice(7) : null;
    req.user = users.fromToken(req.token);
    if (req.user) ledger.settle(req.user);
    next();
  });

  const requireUser = (req, _res, next) => (req.user ? next() : next(unauthorized()));
  const ctx = { db, users, ledger, requireUser };

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, providers: { cleva: cleva.mode, tether: 'sandbox', broker: alpaca.mode, insiderData: fmp.mode } });
  });

  app.use('/api/auth', authRoutes(ctx));
  app.use('/api', walletRoutes(ctx));
  app.use('/api/market', marketRoutes(ctx));
  app.use('/api', tradeRoutes(ctx));
  app.use('/api/learn', learnRoutes(ctx));

  app.use('/api', (_req, res) => res.status(404).json({ error: { code: 'not_found', message: 'Unknown API route.' } }));

  // Serve the built frontend when it exists (production / single-process demo).
  const dist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../frontend/dist');
  if (fs.existsSync(dist)) {
    app.use(express.static(dist, { index: false, maxAge: '1h' }));
    app.get(/^(?!\/api).*/, (_req, res) => res.sendFile(path.join(dist, 'index.html')));
  }

  app.use(errorHandler);
  return { app, db, users, ledger };
}
