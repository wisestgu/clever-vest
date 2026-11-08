import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Clock } from 'lucide-react';
import { api } from '../lib/api';
import { invalidate, useApi } from '../lib/useApi';
import { relativeDay, shortAddress, time, usd } from '../lib/format';
import type { Deposit, Network, Wallet } from '../lib/types';
import { Button, CopyButton, LoadError, Notice, Qr, Skeleton } from '../components/ui';
import { Segmented } from '../components/motion';
import { haptic } from '../lib/motion';

export function Fund() {
  const [method, setMethod] = useState<'usdt' | 'usd'>('usdt');
  const [network, setNetwork] = useState<Network>('TRC20');
  const wallet = useApi<Wallet>('/wallet', { poll: 2000 });
  const w = wallet.data;
  const addr = w?.addresses.find((a) => a.network === network);

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Deposit</h1>
          <p>USDT arrives as US dollars in your Dollo balance, 1:1. No conversion fee from us.</p>
        </div>
      </div>

      <div style={{ marginBottom: 'var(--s-6)' }}>
        <Segmented
          role="tablist"
          label="Deposit method"
          value={method}
          onChange={setMethod}
          options={[
            { value: 'usdt', label: 'USDT (crypto)' },
            { value: 'usd', label: 'USD bank transfer' },
          ]}
        />
      </div>

      {wallet.error && <LoadError error={wallet.error} onRetry={wallet.reload} />}

      {method === 'usdt' ? (
        <div className="split">
          <div className="stack-l">
            <section className="panel panel-pad stack" aria-labelledby="net-h">
              <div className="stack-s">
                <h2 id="net-h" className="field-label">
                  1. Choose the network your exchange will send on
                </h2>
                <div className="network-pick" role="radiogroup" aria-labelledby="net-h">
                  {(w?.addresses ?? []).map((a) => (
                    <button key={a.network} type="button" role="radio" aria-checked={network === a.network} className="network-opt" onClick={() => setNetwork(a.network)}>
                      <span className="network-name">
                        {a.network} <span className="muted">· {a.chain}</span>
                      </span>
                      <span className="network-meta num">
                        Fee ≈ ${a.typicalFeeUsd} · ~{Math.round(a.etaSeconds / 60)} min · min {a.minDepositUsd} USDT
                      </span>
                      {a.network === 'TRC20' && <span className="badge badge-gain">Cheapest</span>}
                    </button>
                  ))}
                  {!w && (
                    <>
                      <Skeleton h={72} />
                      <Skeleton h={72} />
                    </>
                  )}
                </div>
              </div>
              {addr && (
                <Notice kind="warn" title={`${addr.network} only.`}>
                  {addr.warning}
                </Notice>
              )}
            </section>

            <section className="panel panel-pad" aria-labelledby="addr-h">
              <h2 id="addr-h" className="field-label">
                2. Send USDT to your {network} address
              </h2>
              {addr ? (
                <div className="address-block">
                  <Qr value={addr.address} label={`QR code for your ${network} USDT address`} />
                  <div className="stack-s address-text">
                    <div className="address-row">
                      <code className="mono address">{addr.address}</code>
                      <CopyButton value={addr.address} label={`${network} address`} />
                    </div>
                    <p className="hint">Check the first and last 6 characters after pasting: {shortAddress(addr.address)}</p>
                    <Notice kind="info" title="Sandbox address.">
                      Nobody holds the keys to this address. Use the deposit simulator instead; never send real USDT here.
                    </Notice>
                  </div>
                </div>
              ) : (
                <Skeleton h={140} />
              )}
            </section>
          </div>

          <div className="stack-l sticky-col">
            {addr && <Simulator network={network} min={addr.minDepositUsd} />}
            <DepositList deposits={w?.deposits ?? []} loading={!w} />
          </div>
        </div>
      ) : (
        <section className="panel" aria-labelledby="usd-h" style={{ maxWidth: 640 }}>
          <div className="panel-head">
            <h2 id="usd-h">Your US account, powered by Cleva</h2>
          </div>
          <div className="panel-pad stack">
            <p className="muted">Receive dollars from US employers, Payoneer, Upwork or Deel. Transfers land in the same balance you invest from.</p>
            {w ? (
              <dl className="dl account-dl">
                {[
                  ['Account name', w.usdAccount.accountName],
                  ['Bank', w.usdAccount.bankName],
                  ['Account number', w.usdAccount.accountNumber],
                  ['Routing number (ACH)', w.usdAccount.routingNumber],
                  ['Account type', w.usdAccount.accountType],
                ].map(([k, v]) => (
                  <div key={k}>
                    <dt>{k}</dt>
                    <dd className="cluster" style={{ justifyContent: 'flex-end' }}>
                      <span className={/number/.test(k) ? 'mono' : ''}>{v}</span>
                      {/number/.test(k) && <CopyButton value={v} label={k.toLowerCase()} />}
                    </dd>
                  </div>
                ))}
              </dl>
            ) : (
              <Skeleton h={160} />
            )}
            <Notice title="Sandbox details.">These numbers are generated for the demo and can’t receive real transfers.</Notice>
          </div>
        </section>
      )}
    </div>
  );
}

function Simulator({ network, min }: { network: Network; min: number }) {
  const [amount, setAmount] = useState('25');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await api('/deposits/simulate', { body: { network, amount } });
      haptic('tick');
      invalidate();
    } catch (err) {
      haptic('error');
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="panel panel-pad stack sim" onSubmit={submit}>
      <div>
        <h2 className="field-label">Simulate an incoming transfer</h2>
        <p className="hint">Stands in for the blockchain watcher. Watch it confirm, then land in your USD balance.</p>
      </div>
      <div className="field">
        <label htmlFor="sim-amount">Amount (USDT)</label>
        <div className="amount-input">
          <input id="sim-amount" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} aria-invalid={Boolean(error)} aria-describedby={error ? 'sim-err' : undefined} />
          <span className="unit">USDT · {network}</span>
        </div>
        <div className="chips">
          {[min, 10, 25, 100].filter((v, i, a) => a.indexOf(v) === i && v >= min).map((v) => (
            <button key={v} type="button" className="chip" aria-pressed={Number(amount) === v} onClick={() => setAmount(String(v))}>
              {v} USDT
            </button>
          ))}
        </div>
        {error && (
          <span className="error" id="sim-err">
            {error}
          </span>
        )}
      </div>
      <Button variant="primary" type="submit" loading={busy}>
        Send {amount || 0} USDT to my address
      </Button>
    </form>
  );
}

function DepositList({ deposits, loading }: { deposits: Deposit[]; loading: boolean }) {
  // Completion feedback: a haptic on the frame a confirming deposit flips to credited.
  const seen = useRef(new Map<string, string>());
  useEffect(() => {
    let credited = false;
    for (const d of deposits) {
      if (seen.current.get(d.id) === 'confirming' && d.status === 'credited') credited = true;
      seen.current.set(d.id, d.status);
    }
    if (credited) haptic('success');
  }, [deposits]);

  return (
    <section className="panel" aria-labelledby="dep-h" aria-live="polite">
      <div className="panel-head">
        <h2 id="dep-h">Recent deposits</h2>
        <Link to="/activity" className="btn btn-ghost btn-sm">
          All activity
        </Link>
      </div>
      {loading ? (
        <div className="panel-pad">
          <Skeleton h={48} />
        </div>
      ) : deposits.length === 0 ? (
        <div className="empty">
          <p>Deposits show here from the moment the network sees them, with live confirmations.</p>
        </div>
      ) : (
        <ul className="rows">
          {deposits.map((d) => {
            const done = d.status === 'credited';
            const progress = done ? 1 : d.confirmations / d.requiredConfirmations;
            return (
              <li key={d.id} className="row deposit-row">
                {done ? <CheckCircle2 className="gain" aria-hidden="true" /> : <Clock className="pending-icon" aria-hidden="true" />}
                <div className="row-main">
                  <div className="row-title num">{usd(d.amount)} USDT</div>
                  <div className="row-sub">
                    {done ? `Credited · ${relativeDay(d.createdAt)}, ${time(d.createdAt)}` : `Confirming on ${d.network === 'TRC20' ? 'Tron' : 'Ethereum'} · ${d.confirmations}/${d.requiredConfirmations}`}
                  </div>
                  {!done && (
                    <div className="meter" role="progressbar" aria-valuemin={0} aria-valuemax={d.requiredConfirmations} aria-valuenow={d.confirmations} aria-label="Network confirmations">
                      <span style={{ transform: `scaleX(${Math.max(progress, 0.04)})` }} />
                    </div>
                  )}
                </div>
                <span className={`badge ${done ? 'badge-gain' : 'badge-pending'}`}>{done ? `+${usd(d.amount)}` : 'Pending'}</span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
