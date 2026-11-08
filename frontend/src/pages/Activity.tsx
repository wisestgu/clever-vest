import { Link } from 'react-router-dom';
import { ArrowDownLeft, ArrowUpRight, Gift, Landmark, TrendingDown, TrendingUp } from 'lucide-react';
import { useApi } from '../lib/useApi';
import { ngn, relativeDay, shares, time, usd } from '../lib/format';
import type { Activity } from '../lib/types';
import { LoadError, Skeleton } from '../components/ui';

const ICON = { deposit: ArrowDownLeft, buy: TrendingUp, sell: TrendingDown, reward: Gift, withdrawal: Landmark };

function amountText(a: Activity) {
  switch (a.type) {
    case 'deposit':
      return { main: `+${usd(a.amount)}`, sub: 'USDT → USD', cls: 'gain' };
    case 'buy':
      return { main: `−${usd(Math.abs(a.amount))}`, sub: `+${shares(a.shares ?? 0)} ${a.symbol}`, cls: '' };
    case 'sell':
      return { main: `+${usd(a.amount)}`, sub: `−${shares(a.shares ?? 0)} ${a.symbol}`, cls: 'gain' };
    case 'reward':
      return { main: `+${shares(a.shares ?? 0)} ${a.symbol}`, sub: `Worth ${usd(a.value ?? 0)} when earned`, cls: 'brass-text' };
    case 'withdrawal':
      return { main: `−${usd(Math.abs(a.amount))}`, sub: `${ngn(a.receiveNgn ?? 0)} to your bank`, cls: '' };
  }
}

export function ActivityPage() {
  const { data, error, reload } = useApi<{ activity: Activity[] }>('/activity', { poll: 5000 });
  const groups = new Map<string, Activity[]>();
  data?.activity.forEach((a) => {
    const k = relativeDay(a.createdAt);
    groups.set(k, [...(groups.get(k) ?? []), a]);
  });

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Activity</h1>
          <p>Every deposit, trade, reward and withdrawal, newest first.</p>
        </div>
      </div>
      {error && <LoadError error={error} onRetry={reload} />}
      <div className="stack-l" style={{ maxWidth: 760 }}>
        {!data && <Skeleton h={220} />}
        {data && data.activity.length === 0 && (
          <section className="panel empty">
            <h3>Nothing here yet</h3>
            <p>Your first USDT deposit will appear here, followed by every trade you make.</p>
            <Link to="/fund" className="btn btn-primary">
              Deposit USDT
            </Link>
          </section>
        )}
        {[...groups.entries()].map(([day, items]) => (
          <section key={day} aria-label={day}>
            <h2 className="day-label">{day}</h2>
            <ul className="panel rows">
              {items.map((a) => {
                const Icon = ICON[a.type] ?? ArrowUpRight;
                const t = amountText(a);
                return (
                  <li key={a.id} className="row">
                    <span className={`act-icon act-${a.type}`} aria-hidden="true">
                      <Icon />
                    </span>
                    <div className="row-main">
                      <div className="row-title">{a.title}</div>
                      <div className="row-sub">
                        {time(a.createdAt)}
                        {a.status === 'pending' && (
                          <>
                            {' · '}
                            <span className="badge badge-pending">{a.type === 'deposit' ? 'Confirming' : 'Processing'}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="row-end">
                      <strong className={t.cls}>{t.main}</strong>
                      <small className="muted">{t.sub}</small>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
