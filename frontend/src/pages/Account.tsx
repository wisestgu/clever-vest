import { LogOut } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { useApi } from '../lib/useApi';
import { initials } from '../lib/format';
import { Button, CopyButton } from '../components/ui';

interface Health {
  providers: { cleva: string; tether: string; broker: string; insiderData: string };
}

const PROVIDER_COPY: Record<string, { name: string; role: string }> = {
  cleva: { name: 'Cleva', role: 'USD accounts and naira payouts' },
  tether: { name: 'Tether (USDT)', role: 'Stablecoin deposits on Tron and Ethereum' },
  broker: { name: 'Alpaca', role: 'Licensed US broker-dealer: executes and holds your stocks' },
  insiderData: { name: 'Financial Modeling Prep', role: 'Insider filings and company data' },
};

export function Account() {
  const { user, signOut } = useAuth();
  const health = useApi<Health>('/health');
  if (!user) return null;

  return (
    <div className="page">
      <div className="page-head">
        <div className="cluster" style={{ gap: 'var(--s-4)' }}>
          <span className="avatar avatar-lg">{initials(user.name)}</span>
          <div>
            <h1>{user.name}</h1>
            <p>{user.email}</p>
          </div>
        </div>
      </div>

      <div className="split split-even">
        <section className="panel" aria-labelledby="usd-h">
          <div className="panel-head">
            <h2 id="usd-h">USD account (Cleva)</h2>
          </div>
          <div className="panel-pad">
            <dl className="dl account-dl">
              {[
                ['Account name', user.usdAccount.accountName],
                ['Bank', user.usdAccount.bankName],
                ['Account number', user.usdAccount.accountNumber],
                ['Routing number', user.usdAccount.routingNumber],
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
          </div>
        </section>

        <section className="panel" aria-labelledby="wal-h">
          <div className="panel-head">
            <h2 id="wal-h">USDT deposit addresses</h2>
          </div>
          <div className="panel-pad stack">
            {Object.values(user.wallets).map((w) => (
              <div key={w.network} className="field">
                <span className="field-label">{w.network === 'TRC20' ? 'Tron (TRC20)' : 'Ethereum (ERC20)'}</span>
                <div className="address-row">
                  <code className="mono address">{w.address}</code>
                  <CopyButton value={w.address} label={`${w.network} address`} />
                </div>
              </div>
            ))}
            <p className="hint">Sandbox addresses. Nobody holds their keys, so never send real funds to them.</p>
          </div>
        </section>
      </div>

      <section className="section" aria-labelledby="prov-h">
        <div className="section-head">
          <div>
            <h2 id="prov-h">Who does what</h2>
            <p>Dollo is the app, the lessons and the order routing. Licensed partners hold your money and your stocks.</p>
          </div>
        </div>
        <ul className="panel rows" style={{ maxWidth: 760 }}>
          {Object.entries(PROVIDER_COPY).map(([key, p]) => {
            const mode = health.data?.providers[key as keyof Health['providers']];
            return (
              <li key={key} className="row provider-row">
                <span className="row-main">
                  <span className="row-title">{p.name}</span>
                  <span className="row-sub">{p.role}</span>
                </span>
                <span className={`badge ${mode && mode !== 'sandbox' ? 'badge-gain' : ''}`}>{mode ? (mode === 'sandbox' ? 'Sandbox' : `Live: ${mode}`) : '…'}</span>
              </li>
            );
          })}
        </ul>
      </section>

      <div className="section">
        <Button onClick={signOut}>
          <LogOut aria-hidden="true" /> Sign out
        </Button>
      </div>
    </div>
  );
}
