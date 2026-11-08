import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { useApi } from '../lib/useApi';
import { useAuth } from '../lib/auth';
import { pct, relativeDay, shares, signedUsd, tone, usd } from '../lib/format';
import type { CourseSummary, InsiderTrade, Portfolio } from '../lib/types';
import { MoneyRoute } from '../components/MoneyRoute';
import { Allocation } from '../components/Allocation';
import { LoadError, Skeleton, Ticker } from '../components/ui';
import { AnimatedNumber } from '../components/motion';
import { Note } from '../components/Note';
import { Coin } from '../components/Coin';

export function serialOf(accountNumber?: string) {
  if (!accountNumber) return 'DL 0000 000000';
  return `DL ${accountNumber.slice(0, 4)} ${accountNumber.slice(4)}`;
}

export function Home() {
  const { user } = useAuth();
  const pf = useApi<{ portfolio: Portfolio }>('/portfolio', { poll: 10_000 });
  const feed = useApi<{ insiders: InsiderTrade[]; source: string }>('/market/feed');
  const courses = useApi<{ courses: CourseSummary[] }>('/learn/courses');
  const p = pf.data?.portfolio;
  const nextCourse = courses.data?.courses.find((c) => !c.completed);
  const wire = feed.data?.insiders.slice(0, 3) ?? [];
  const firstName = user?.name.split(' ')[0];

  return (
    <div className="page home">
      {pf.error && <LoadError error={pf.error} onRetry={pf.reload} />}

      <section className="hero" aria-labelledby="total-h">
        {p ? (
          <Note seed={user?.id ?? 'dollo'} micro="DOLLO · ONE DOLLAR · ỌKAN DỌLA · OTU DOLLAR · DALA ƊAYA" serial={serialOf(user?.usdAccount.accountNumber)} corner="$">
            <span className="note-label">{firstName}’s portfolio</span>
            <h1 id="total-h" className="denom num">
              <span className="visually-hidden">Total value </span>
              <AnimatedNumber value={p.total} format={usd} />
            </h1>
            <p className="note-sub num">
              <span className={`chip-ink ${tone(p.dayChange) || 'flat'}`}>{signedUsd(p.dayChange)} today</span>
              <span>
                {usd(p.invested)} in stocks · {usd(p.cash)} ready
              </span>
            </p>
          </Note>
        ) : (
          <Skeleton h={260} r={18} />
        )}
        <div className="hero-side">
          <h2 className="side-title">Where it sits</h2>
          {p ? p.total > 0 ? <Allocation allocation={p.allocation} /> : <p className="muted">Your split appears after your first deposit.</p> : <Skeleton h={120} />}
        </div>
      </section>

      {p && <MoneyRoute route={p.route} />}

      <div className="split home-split">
        <section aria-labelledby="holdings-h">
          <div className="section-head">
            <h2 id="holdings-h">Your stocks</h2>
            {p && p.holdings.length > 0 && <span className={`num ${tone(p.pl)}`}>{signedUsd(p.pl)} since you bought</span>}
          </div>
          {!p ? (
            <Skeleton h={160} />
          ) : p.holdings.length === 0 ? (
            <div className="empty sheet-plain">
              <h3>{p.cash > 0 ? `${usd(p.cash)} is waiting to be invested` : 'Start with a USDT deposit'}</h3>
              <p>
                {p.cash > 0
                  ? 'Pick a company you already know. A slice starts at $1, so the share price doesn’t matter.'
                  : 'Send USDT on Tron or Ethereum. It lands here as dollars, one for one, ready for slices of US companies from $1.'}
              </p>
              <Link className="btn btn-primary" to={p.cash > 0 ? '/discover' : '/fund'}>
                {p.cash > 0 ? 'Browse markets' : 'Deposit USDT'}
              </Link>
            </div>
          ) : (
            <ul className="ledger">
              {p.holdings.map((h) => (
                <li key={h.symbol}>
                  <Link to={`/stocks/${h.symbol}`} className="ledger-row">
                    <Ticker symbol={h.symbol} />
                    <span className="ledger-main">
                      <span className="ledger-title">{h.name}</span>
                      <span className="ledger-sub num">
                        {shares(h.shares)} sh · {usd(h.price)}
                      </span>
                    </span>
                    <span className="ledger-end num">
                      <strong>{usd(h.value)}</strong>
                      <small className={tone(h.pl)}>
                        {signedUsd(h.pl)} · {pct(h.plPct)}
                      </small>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="stack-l">
          {nextCourse && (
            <Link to={`/learn/${nextCourse.id}`} className="reward-slip" aria-labelledby="learn-h">
              <Coin value={`$${nextCourse.reward.usd}`} seed={nextCourse.id} size={64} />
              <span className="reward-text">
                <span className="reward-kicker">Earn {nextCourse.reward.name} stock</span>
                <span id="learn-h" className="reward-title">
                  {nextCourse.title}
                </span>
                <span className="reward-meta">60 seconds · 3 questions</span>
              </span>
              <ArrowRight className="reward-arrow" aria-hidden="true" />
            </Link>
          )}

          {wire.length > 0 && (
            <section aria-labelledby="wire-h">
              <div className="section-head">
                <h2 id="wire-h">Insider wire</h2>
                <Link to="/discover" className="link-quiet">
                  All moves <ArrowUpRight size={14} aria-hidden="true" />
                </Link>
              </div>
              <ul className="wire">
                {wire.map((i) => (
                  <li key={i.id}>
                    <Link to={`/stocks/${i.symbol}`} className="wire-row" data-side={i.type}>
                      <span className="wire-side" aria-hidden="true">
                        {i.type === 'buy' ? 'BUY' : 'SELL'}
                      </span>
                      <span className="wire-text">{i.headline}</span>
                      <span className="wire-date">{relativeDay(i.filedAt)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
              {feed.data?.source === 'sample' && <p className="hint">Sample filings for the sandbox, not real trades.</p>}
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
