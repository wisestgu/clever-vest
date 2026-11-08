import { NavLink, Link, Outlet, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowDownToLine, ChartLine, GraduationCap, ReceiptText, Wallet } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { initials } from '../lib/format';
import { spring } from '../lib/motion';
import { Logo } from './ui';

const NAV = [
  { to: '/', label: 'Portfolio', icon: Wallet, end: true },
  { to: '/discover', label: 'Markets', icon: ChartLine },
  { to: '/learn', label: 'Learn & earn', short: 'Learn', icon: GraduationCap },
  { to: '/activity', label: 'Activity', icon: ReceiptText },
];

function isActive(pathname: string, to: string, end?: boolean) {
  if (end) return pathname === to;
  if (to === '/discover') return pathname.startsWith('/discover') || pathname.startsWith('/stocks');
  return pathname.startsWith(to);
}

export function Shell() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const name = user?.name ?? '';
  return (
    <div className="shell">
      <header className="masthead">
        <div className="masthead-inner">
          <Link to="/" className="brand" aria-label="Dollo, portfolio">
            <Logo />
            <span>Dollo</span>
          </Link>
          <nav className="topnav" aria-label="Main">
            {NAV.map(({ to, label, end }) => {
              const on = isActive(pathname, to, end);
              return (
                <NavLink key={to} to={to} end={end} className="topnav-link" aria-current={on ? 'page' : undefined}>
                  {label}
                  {on && <motion.span className="topnav-ink" layoutId="topnav-ink" transition={spring.snappy} />}
                </NavLink>
              );
            })}
          </nav>
          <div className="masthead-actions">
            <span className="sandbox-tag">Sandbox</span>
            <Link to="/withdraw" className="btn btn-quiet btn-sm hide-sm">
              Withdraw ₦
            </Link>
            <Link to="/fund" className="btn btn-primary btn-sm hide-sm">
              Deposit USDT
            </Link>
            <Link to="/account" className="avatar" aria-label={`Account: ${name}`}>
              {initials(name)}
            </Link>
          </div>
        </div>
      </header>

      <main className="main" id="main">
        <Outlet />
      </main>

      <nav className="tabbar" aria-label="Main">
        {[NAV[0], NAV[1], { to: '/fund', label: 'Deposit', short: 'Deposit', icon: ArrowDownToLine }, NAV[2], NAV[3]].map(({ to, label, short, icon: Icon, end }) => {
          const on = isActive(pathname, to, end);
          return (
            <NavLink key={to} to={to} end={end} className="tab" aria-current={on ? 'page' : undefined}>
              <Icon aria-hidden="true" />
              {short ?? label}
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}
