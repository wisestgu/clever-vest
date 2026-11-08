import { Link } from 'react-router-dom';
import { ngn, usd } from '../lib/format';
import { AnimatedNumber } from './motion';
import { WaveBand } from './Guilloche';
import type { Portfolio } from '../lib/types';

// The money route: value travels along an engraved guilloche line, boarding as USDT and leaving
// as naira. While a deposit is confirming, the first leg of the line flows.

interface Stop {
  key: string;
  label: string;
  value: number;
  fmt: (n: number) => string;
  note: string;
  to: string;
  action: string;
  empty: boolean;
}

export function MoneyRoute({ route }: { route: Portfolio['route'] }) {
  const stops: Stop[] = [
    { key: 'in', label: 'USDT in', value: route.usdtIn, fmt: usd, note: route.usdtPending ? `+${usd(route.usdtPending)} arriving` : 'Tron · Ethereum', to: '/fund', action: 'Deposit', empty: !route.usdtIn && !route.usdtPending },
    { key: 'usd', label: 'Dollars', value: route.usd, fmt: usd, note: 'Ready to invest', to: '/fund', action: 'Add', empty: !route.usd },
    { key: 'stocks', label: 'US stocks', value: route.stocks, fmt: usd, note: 'From $1 a slice', to: '/discover', action: 'Invest', empty: !route.stocks },
    { key: 'out', label: 'Naira out', value: route.ngnOut, fmt: (n) => ngn(n), note: 'To your bank', to: '/withdraw', action: 'Withdraw', empty: !route.ngnOut },
  ];

  return (
    <nav className="route" aria-label="Your money route">
      <div className="route-track" aria-hidden="true">
        <WaveBand width={900} height={14} lines={3} waves={22} seed="route" className="route-wave" />
        {route.usdtPending > 0 && <span className="route-pulse" />}
      </div>
      <ol className="route-line">
        {stops.map((s, i) => (
          <li key={s.key} className="route-stop" data-empty={s.empty || undefined}>
            <span className="route-node" aria-hidden="true">
              {i + 1}
            </span>
            <span className="route-label">{s.label}</span>
            <AnimatedNumber className="route-value num" value={s.value} format={s.fmt} />
            <span className="route-note">{s.note}</span>
            <Link className="route-action" to={s.to}>
              {s.action}
              <span className="visually-hidden"> ({s.label})</span>
            </Link>
          </li>
        ))}
      </ol>
    </nav>
  );
}
