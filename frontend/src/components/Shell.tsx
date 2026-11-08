import { NavLink, Link, Outlet } from 'react-router-dom';
import { ArrowDownToLine, ArrowUpFromLine, ChartLine, GraduationCap, ReceiptText, Wallet } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { initials } from '../lib/format';
import { Logo } from './ui';

const NAV = [
  { to: '/', label: 'Portfolio', icon: Wallet, end: true },
  { to: '/discover', label: 'Markets', icon: ChartLine },
  { to: '/learn', label: 'Learn & earn', short: 'Learn', icon: GraduationCap },
  { to: '/activity', label: 'Activity', icon: ReceiptText },
];

export function Shell() {
  const { user } = useAuth();
  const name = user?.name ?? '';
  return (
    <div className="shell">
      <aside className="rail" aria-label="Main">
        <Link to="/" className="brand">
          <Logo />
          Dollo
        </Link>
        <nav>
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className="rail-link">
              <Icon aria-hidden="true" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="rail-actions">
          <Link to="/fund" className="btn btn-brass btn-block">
            <ArrowDownToLine aria-hidden="true" />
            Deposit USDT
          </Link>
          <Link to="/withdraw" className="btn btn-shell btn-block">
            <ArrowUpFromLine aria-hidden="true" />
            Withdraw to naira
          </Link>
        </div>
        <div className="rail-foot">
          <span className="sandbox-pill">Sandbox · test money only</span>
          <Link to="/account" className="rail-user">
            <span className="avatar">{initials(name)}</span>
            <span>
              {name}
              <small>Account &amp; USD details</small>
            </span>
          </Link>
        </div>
      </aside>

      <header className="topbar">
        <Link to="/" className="brand">
          <Logo />
          Dollo
        </Link>
        <div className="cluster">
          <span className="sandbox-pill">Sandbox</span>
          <Link to="/account" className="avatar" aria-label="Account">
            {initials(name)}
          </Link>
        </div>
      </header>

      <main className="main" id="main">
        <Outlet />
      </main>

      <nav className="tabbar" aria-label="Main">
        {[NAV[0], NAV[1], { to: '/fund', label: 'Deposit', short: 'Deposit', icon: ArrowDownToLine }, NAV[2], NAV[3]].map(({ to, label, short, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} className="tab">
            <Icon aria-hidden="true" />
            {short ?? label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
