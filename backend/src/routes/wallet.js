import { Router } from 'express';
import { badRequest } from '../lib/errors.js';
import { fromCents, parseUsd } from '../lib/money.js';
import { NETWORKS } from '../providers/tether.js';
import { BANKS, resolveAccount } from '../providers/cleva.js';
import { usdNgn } from '../providers/fx.js';

export default function walletRoutes({ db, ledger, requireUser }) {
  const r = Router();

  r.get('/networks', (_req, res) => res.json({ networks: Object.values(NETWORKS) }));

  r.get('/wallet', requireUser, (req, res) => {
    const u = req.user;
    const deposits = db.state.deposits
      .filter((d) => d.userId === u.id)
      .slice(-10)
      .reverse()
      .map((d) => ledger.depositView(d));
    res.json({
      balance: { usd: fromCents(u.balances.usdCents) },
      usdAccount: u.cleva,
      addresses: Object.values(u.wallets).map((w) => ({ ...w, ...NETWORKS[w.network] })),
      deposits,
    });
  });

  r.get('/deposits/:id', requireUser, (req, res) => {
    const d = db.state.deposits.find((x) => x.id === req.params.id && x.userId === req.user.id);
    if (!d) return res.status(404).json({ error: { code: 'not_found', message: 'Deposit not found.' } });
    res.json({ deposit: ledger.depositView(d) });
  });

  // Sandbox only: stands in for the blockchain watcher that would detect an incoming transfer.
  r.post('/deposits/simulate', requireUser, (req, res) => {
    const amountCents = parseUsd(req.body?.amount);
    if (!amountCents) throw badRequest('invalid_amount', 'Enter how much USDT to send, e.g. 25.');
    const deposit = ledger.simulateDeposit(req.user, { network: req.body?.network, amountCents });
    res.status(201).json({ deposit });
  });

  r.get('/fx', (_req, res) => res.json(usdNgn()));

  r.get('/banks', (_req, res) => res.json({ banks: BANKS }));

  r.post('/banks/resolve', requireUser, (req, res) => {
    const result = resolveAccount({ bankCode: String(req.body?.bankCode ?? ''), accountNumber: String(req.body?.accountNumber ?? ''), fallbackName: req.user.name });
    if (!result.ok) {
      const messages = {
        unknown_bank: 'Choose a bank from the list.',
        invalid_account_number: 'Nigerian account numbers (NUBAN) are exactly 10 digits.',
        account_not_found: 'We couldn’t find that account. Check the number and the bank.',
      };
      throw badRequest(result.reason, messages[result.reason]);
    }
    res.json({ accountName: result.accountName, bank: result.bank, accountNumber: result.accountNumber });
  });

  r.get('/withdrawals/quote', requireUser, (req, res) => {
    const amountCents = parseUsd(req.query.amount);
    if (!amountCents) throw badRequest('invalid_amount', 'Enter an amount in dollars.');
    res.json(ledger.withdrawalQuote(amountCents));
  });

  r.post('/withdrawals', requireUser, (req, res) => {
    const amountCents = parseUsd(req.body?.amount);
    if (!amountCents) throw badRequest('invalid_amount', 'Enter an amount in dollars.');
    const w = ledger.withdraw(req.user, { amountCents, bankCode: String(req.body?.bankCode ?? ''), accountNumber: String(req.body?.accountNumber ?? '') });
    res.status(201).json({ withdrawal: w });
  });

  r.get('/withdrawals/:id', requireUser, (req, res) => {
    const w = db.state.withdrawals.find((x) => x.id === req.params.id && x.userId === req.user.id);
    if (!w) return res.status(404).json({ error: { code: 'not_found', message: 'Withdrawal not found.' } });
    res.json({ withdrawal: w });
  });

  r.get('/activity', requireUser, (req, res) => {
    const items = db.state.activity
      .filter((a) => a.userId === req.user.id)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 100)
      .map(({ userId, ...a }) => ({ ...a, amount: fromCents(a.amountCents ?? 0), value: a.valueCents != null ? fromCents(a.valueCents) : undefined, receiveNgn: a.receiveKobo != null ? a.receiveKobo / 100 : undefined }));
    res.json({ activity: items });
  });

  return r;
}
