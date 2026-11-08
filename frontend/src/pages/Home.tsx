import { Link } from 'react-router-dom';
import { ArrowRight, GraduationCap } from 'lucide-react';
import { useApi } from '../lib/useApi';
import { useAuth } from '../lib/auth';
import { pct, shares, signedUsd, tone, usd } from '../lib/format';
import type { CourseSummary, InsiderTrade, Portfolio } from '../lib/types';
import { MoneyRoute } from '../components/MoneyRoute';
import { Allocation } from '../components/Allocation';
import { ChangeBadge, LoadError, Skeleton, Ticker } from '../components/ui';

export function Home() {
  const { user } = useAuth();
  const pf = useApi<{ portfolio: Portfolio }>('/portfolio', { poll: 10_000 });
  const feed = useApi<{ insiders: InsiderTrade[]; source: string }>('/market/feed');
  const courses = useApi<{ courses: CourseSummary[] }>('/learn/courses');
  const p = pf.data?.portfolio;
  const nextCourse = courses.data?.courses.find((c) => !c.completed);
  const insider = feed.data?.insiders.find((i) => i.type === 'buy');
  const firstName = user?.name.split(' ')[0];

  return (
    <>
      <section className="band adire">
        <div className="band-inner">
          <div className="band-head">
            <div>
              <p className="band-hello">Good to see you, {firstName}</p>
              {p ? (
                <>
                  <h1 className="band-total num" aria-label={`Total value ${usd(p.total)}`}>
                    {usd(p.total)}
                  </h1>
                  <p className="band-sub num">
                    <span className={`on-shell-${tone(p.dayChange) || 'flat'}`}>{signedUsd(p.dayChange)} today</span>
                    <span aria-hidden="true"> · </span>
                    {usd(p.invested)} in stocks, {usd(p.cash)} ready to invest
                  </p>
                </>
              ) : (
                <div className="stack-s" style={{ marginTop: 8 }}>
                  <Skeleton h={40} w={200} />
                  <Skeleton h={14} w={260} />
                </div>
              )}
            </div>
          </div>
          {p ? <MoneyRoute route={p.route} /> : <Skeleton h={120} />}
        </div>
      </section>

      <div className="page">
        {pf.error && <LoadError error={pf.error} onRetry={pf.reload} />}
        <div className="split">
          <section className="panel" aria-labelledby="holdings-h">
            <div className="panel-head">
              <h2 id="holdings-h">Your stocks</h2>
              {p && p.holdings.length > 0 && (
                <span className={`num ${tone(p.pl)}`} title="Gain or loss since you bought">
                  {signedUsd(p.pl)} all time
                </span>
              )}
            </div>
            {!p ? (
              <div className="panel-pad stack">
                <Skeleton h={40} />
                <Skeleton h={40} />
                <Skeleton h={40} />
              </div>
            ) : p.holdings.length === 0 ? (
              <div className="empty">
                <h3>{p.cash > 0 ? `You have ${usd(p.cash)} ready to invest` : 'Start with a USDT deposit'}</h3>
                <p>
                  {p.cash > 0
                    ? 'Pick a company you already know. You can buy a slice from $1, so you don’t need the full share price.'
                    : 'Send USDT on Tron or Ethereum and it lands here as US dollars, 1:1. Then buy slices of US companies from $1.'}
                </p>
                <Link className="btn btn-primary" to={p.cash > 0 ? '/discover' : '/fund'}>
                  {p.cash > 0 ? 'Find a stock' : 'Deposit USDT'}
                </Link>
              </div>
            ) : (
              <ul className="rows">
                {p.holdings.map((h) => (
                  <li key={h.symbol}>
                    <Link to={`/stocks/${h.symbol}`} className="row">
                      <Ticker symbol={h.symbol} />
                      <div className="row-main">
                        <div className="row-title">{h.name}</div>
                        <div className="row-sub num">
                          {shares(h.shares)} shares · {usd(h.price)}
                        </div>
                      </div>
                      <div className="row-end">
                        <strong>{usd(h.value)}</strong>
                        <small className={tone(h.pl)}>
                          {signedUsd(h.pl)} ({pct(h.plPct)})
                        </small>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <div className="stack-l">
            <section className="panel" aria-labelledby="alloc-h">
              <div className="panel-head">
                <h2 id="alloc-h">Where your money sits</h2>
              </div>
              <div className="panel-pad">
                {p ? (
                  p.total > 0 ? (
                    <Allocation allocation={p.allocation} />
                  ) : (
                    <p className="muted">Your split between US stocks and your USD reserve shows up after your first deposit.</p>
                  )
                ) : (
                  <Skeleton h={90} />
                )}
              </div>
            </section>

            {nextCourse && (
              <section className="panel learn-teaser" aria-labelledby="learn-h">
                <div className="panel-pad stack-s">
                  <span className="badge badge-brass">
                    <GraduationCap size={14} aria-hidden="true" /> Earn ${nextCourse.reward.usd} of {nextCourse.reward.name}
                  </span>
                  <h2 id="learn-h">{nextCourse.title}</h2>
                  <p className="muted">A 60-second lesson and three quick questions. Get them all right and the stock is yours.</p>
                  <div>
                    <Link className="btn btn-sm" to={`/learn/${nextCourse.id}`}>
                      Start lesson <ArrowRight aria-hidden="true" />
                    </Link>
                  </div>
                </div>
              </section>
            )}
          </div>
        </div>

        {insider && (
          <section className="section" aria-labelledby="pulse-h">
            <div className="section-head">
              <div>
                <h2 id="pulse-h">Insider moves this week</h2>
                <p>What company leaders did with their own shares, in plain English.</p>
              </div>
              <Link to="/discover" className="btn btn-ghost btn-sm">
                See all <ArrowRight aria-hidden="true" />
              </Link>
            </div>
            <article className="insider insider-wide">
              <div className="insider-top">
                <Ticker symbol={insider.symbol} />
                <span className="badge badge-gain">Insider buy</span>
                {insider.source === 'sample' && <span className="badge">Sample data</span>}
              </div>
              <h3>{insider.headline}</h3>
              <p>{insider.meaning}</p>
              <div className="insider-foot">
                <span className="num muted">
                  {insider.quote && (
                    <>
                      Now {usd(insider.quote.price)} <ChangeBadge value={insider.quote.changePct} />
                    </>
                  )}
                </span>
                <Link to={`/stocks/${insider.symbol}`} className="btn btn-sm btn-primary">
                  View {insider.name}
                </Link>
              </div>
            </article>
          </section>
        )}
      </div>
    </>
  );
}
