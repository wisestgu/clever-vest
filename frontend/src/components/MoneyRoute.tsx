import { Link } from 'react-router-dom';
import { ngn, usd } from '../lib/format';
import type { Portfolio } from '../lib/types';

// The signature: the user's money drawn as a transit line. USDT boards on the left, rides through
// the USD balance and US stocks, and alights in naira at a Nigerian bank on the right.

interface Stop {
  key: string;
  label: string;
  value: string;
  note: string;
  to: string;
  action: string;
  interchange?: boolean;
  empty: boolean;
}

export function MoneyRoute({ route }: { route: Portfolio['route'] }) {
  const stops: Stop[] = [
    { key: 'in', label: 'USDT in', value: usd(route.usdtIn), note: route.usdtPending ? `+${usd(route.usdtPending)} arriving` : 'TRC20 · ERC20', to: '/fund', action: 'Deposit', empty: !route.usdtIn && !route.usdtPending },
    { key: 'usd', label: 'USD balance', value: usd(route.usd), note: 'Held with Cleva', to: '/fund', action: 'Add', interchange: true, empty: !route.usd },
    { key: 'stocks', label: 'US stocks', value: usd(route.stocks), note: 'From $1', to: '/discover', action: 'Invest', interchange: true, empty: !route.stocks },
    { key: 'out', label: 'Naira out', value: ngn(route.ngnOut), note: 'To your bank', to: '/withdraw', action: 'Withdraw', empty: !route.ngnOut },
  ];

  return (
    <nav className="route" aria-label="Your money route">
      <ol className="route-line" data-flowing={route.usdtPending > 0 || undefined}>
        {stops.map((s) => (
          <li key={s.key} className="route-stop" data-interchange={s.interchange || undefined} data-empty={s.empty || undefined}>
            <span className="route-label">{s.label}</span>
            <span className="route-node" aria-hidden="true" />
            <span className="route-value num">{s.value}</span>
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
