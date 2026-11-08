import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Clock, Loader2 } from 'lucide-react';
import { api } from '../lib/api';
import { invalidate, useApi } from '../lib/useApi';
import { ngn, usd } from '../lib/format';
import type { Bank, Wallet, Withdrawal, WithdrawalQuote } from '../lib/types';
import { Button, Notice, Skeleton } from '../components/ui';

function useDebounced<T>(value: T, ms = 350) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

export function Withdraw() {
  const wallet = useApi<Wallet>('/wallet');
  const banks = useApi<{ banks: Bank[] }>('/banks');
  const [amount, setAmount] = useState('');
  const [bankCode, setBankCode] = useState('');
  const [account, setAccount] = useState('');
  const [resolved, setResolved] = useState<{ name: string } | { error: string } | 'loading' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<Withdrawal | null>(null);

  const balance = wallet.data?.balance.usd ?? 0;
  const amt = Number(amount);
  const debounced = useDebounced(amount);
  const validAmount = Number(debounced) >= 2;
  const quote = useApi<WithdrawalQuote>(validAmount ? `/withdrawals/quote?amount=${encodeURIComponent(debounced)}` : null, { poll: 15_000 });

  useEffect(() => {
    setResolved(null);
    if (!bankCode || !/^\d{10}$/.test(account)) return;
    let alive = true;
    setResolved('loading');
    api<{ accountName: string }>('/banks/resolve', { body: { bankCode, accountNumber: account } })
      .then((r) => alive && setResolved({ name: r.accountName }))
      .catch((e) => alive && setResolved({ error: (e as Error).message }));
    return () => {
      alive = false;
    };
  }, [bankCode, account]);

  const overBalance = amt > balance;
  const canSubmit = amt >= 2 && !overBalance && resolved && typeof resolved === 'object' && 'name' in resolved;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setBusy(true);
    setError(null);
    try {
      const { withdrawal } = await api<{ withdrawal: Withdrawal }>('/withdrawals', { body: { amount, bankCode, accountNumber: account } });
      setDone(withdrawal);
      invalidate();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (done) return <WithdrawalStatus initial={done} onAnother={() => { setDone(null); setAmount(''); }} />;

  const q = quote.data;
  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Withdraw to naira</h1>
          <p>Send dollars from your balance to any Nigerian bank account in your name, paid out through Cleva.</p>
        </div>
      </div>

      <form className="split" onSubmit={submit} noValidate>
        <div className="panel panel-pad stack-l">
          <div className="field">
            <div className="cluster" style={{ justifyContent: 'space-between' }}>
              <label htmlFor="wd-amount">Amount to withdraw</label>
              <span className="hint num">
                Available: {wallet.data ? usd(balance) : '…'}
              </span>
            </div>
            <div className="amount-input">
              <span aria-hidden="true">$</span>
              <input id="wd-amount" inputMode="decimal" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ''))} aria-invalid={overBalance || undefined} />
              <span className="unit">USD</span>
            </div>
            <div className="chips">
              {[10, 25, 50].filter((v) => v <= balance).map((v) => (
                <button key={v} type="button" className="chip" aria-pressed={amt === v} onClick={() => setAmount(String(v))}>
                  {usd(v)}
                </button>
              ))}
              {balance >= 2 && (
                <button type="button" className="chip" aria-pressed={amt === balance} onClick={() => setAmount(balance.toFixed(2))}>
                  All {usd(balance)}
                </button>
              )}
            </div>
            {overBalance && <span className="error">That’s more than your available {usd(balance)}. Sell some stock first, or lower the amount.</span>}
            {amount && amt > 0 && amt < 2 && <span className="error">The minimum withdrawal is $2.</span>}
          </div>

          <div className="field">
            <label htmlFor="bank">Bank</label>
            <select id="bank" className="select" value={bankCode} onChange={(e) => setBankCode(e.target.value)}>
              <option value="">Choose your bank</option>
              {banks.data?.banks.map((b) => (
                <option key={b.code} value={b.code}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="acct">Account number</label>
            <input id="acct" className="input num" inputMode="numeric" autoComplete="off" maxLength={10} placeholder="10-digit NUBAN" value={account} onChange={(e) => setAccount(e.target.value.replace(/\D/g, ''))} />
            {resolved === 'loading' && (
              <span className="hint cluster">
                <Loader2 className="spin" size={14} aria-hidden="true" /> Checking account name…
              </span>
            )}
            {resolved && typeof resolved === 'object' && 'name' in resolved && (
              <span className="resolved">
                <CheckCircle2 size={16} aria-hidden="true" /> {resolved.name}
              </span>
            )}
            {resolved && typeof resolved === 'object' && 'error' in resolved && <span className="error">{resolved.error}</span>}
          </div>
        </div>

        <aside className="panel panel-pad stack sticky-col" aria-labelledby="sum-h" aria-live="polite">
          <h2 id="sum-h" className="field-label">
            You’ll receive
          </h2>
          <p className="receive num">{q && validAmount ? ngn(q.receiveNgn, true) : '₦0.00'}</p>
          {q && validAmount ? (
            <dl className="dl">
              <div>
                <dt>You send</dt>
                <dd>{usd(q.amount)}</dd>
              </div>
              <div>
                <dt>Dollo fee (1%, min $0.50)</dt>
                <dd>−{usd(q.fee)}</dd>
              </div>
              <div>
                <dt>Rate</dt>
                <dd>$1 = {ngn(q.rate, true)}</dd>
              </div>
              <div>
                <dt>Arrives</dt>
                <dd>Usually within minutes</dd>
              </div>
            </dl>
          ) : quote.loading ? (
            <Skeleton h={100} />
          ) : (
            <p className="hint">Enter an amount from $2 to see the naira you’ll get, after fees.</p>
          )}
          {error && <Notice kind="error">{error}</Notice>}
          <Button variant="primary" type="submit" block loading={busy} disabled={!canSubmit}>
            {canSubmit ? `Withdraw ${usd(amt)}` : 'Withdraw'}
          </Button>
          <p className="hint">The rate is indicative and refreshes every 15 seconds. Sandbox: no real naira is sent.</p>
        </aside>
      </form>
    </div>
  );
}

function WithdrawalStatus({ initial, onAnother }: { initial: Withdrawal; onAnother: () => void }) {
  const live = useApi<{ withdrawal: Withdrawal }>(`/withdrawals/${initial.id}`, { poll: 2000 });
  const w = live.data?.withdrawal ?? initial;
  const complete = w.status === 'completed';
  return (
    <div className="page">
      <section className="panel panel-pad stack-l result" style={{ maxWidth: 560 }} aria-live="polite">
        <div className={`result-icon ${complete ? 'gain' : 'pending-icon'}`}>{complete ? <CheckCircle2 /> : <Clock />}</div>
        <div className="stack-s">
          <h1>{complete ? 'Naira sent' : 'Sending your naira'}</h1>
          <p className="muted">
            {complete
              ? `${ngn(w.receiveKobo / 100, true)} has been paid to ${w.accountName} at ${w.bankName}.`
              : `We’ve taken ${usd(w.amountCents / 100)} from your balance and Cleva is paying ${w.bankName}. This usually takes a few minutes.`}
          </p>
        </div>
        <dl className="dl">
          <div>
            <dt>Amount</dt>
            <dd>{ngn(w.receiveKobo / 100, true)}</dd>
          </div>
          <div>
            <dt>To</dt>
            <dd>
              {w.accountName} · {w.bankName} ····{w.accountNumber.slice(-4)}
            </dd>
          </div>
          <div>
            <dt>Rate</dt>
            <dd>$1 = {ngn(w.rate, true)}</dd>
          </div>
          <div>
            <dt>Reference</dt>
            <dd className="mono">{w.reference}</dd>
          </div>
        </dl>
        <div className="cluster">
          <Link to="/" className="btn btn-primary">
            Back to home
          </Link>
          <Button onClick={onAnother}>Make another withdrawal</Button>
        </div>
      </section>
    </div>
  );
}
