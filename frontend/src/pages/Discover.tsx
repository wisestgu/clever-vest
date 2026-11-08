import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Search } from 'lucide-react';
import { useApi } from '../lib/useApi';
import { relativeDay, usd } from '../lib/format';
import type { Collection, InsiderTrade, Listing } from '../lib/types';
import { ChangeBadge, LoadError, Skeleton, Ticker } from '../components/ui';

export function StockRow({ s }: { s: Listing }) {
  return (
    <Link to={`/stocks/${s.symbol}`} className="row">
      <Ticker symbol={s.symbol} />
      <div className="row-main">
        <div className="row-title">{s.name}</div>
        <div className="row-sub">
          {s.sector} · Risk {s.risk}/10
        </div>
      </div>
      <div className="row-end">
        <strong>{s.price != null ? usd(s.price) : '—'}</strong>
        <ChangeBadge value={s.changePct} />
      </div>
    </Link>
  );
}

export function Discover() {
  const [q, setQ] = useState('');
  const [term, setTerm] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setTerm(q.trim()), 250);
    return () => clearTimeout(t);
  }, [q]);

  const feed = useApi<{ insiders: InsiderTrade[]; source: string }>('/market/feed');
  const cols = useApi<{ collections: Collection[] }>('/market/collections', { poll: 30_000 });
  const results = useApi<{ results: Listing[] }>(term ? `/market/search?q=${encodeURIComponent(term)}` : null);

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Discover</h1>
          <p>What insiders are doing, themes worth knowing, and every company explained in plain English.</p>
        </div>
      </div>

      <div className="search">
        <Search aria-hidden="true" />
        <label htmlFor="q" className="visually-hidden">
          Search stocks
        </label>
        <input id="q" className="input" type="search" placeholder="Search Apple, TSLA, clean energy…" value={q} onChange={(e) => setQ(e.target.value)} autoComplete="off" />
      </div>

      {term ? (
        <section className="panel section-tight" aria-live="polite" aria-label="Search results">
          {results.loading && !results.data ? (
            <div className="panel-pad">
              <Skeleton h={44} />
            </div>
          ) : results.data?.results.length ? (
            <ul className="rows">
              {results.data.results.map((s) => (
                <li key={s.symbol}>
                  <StockRow s={s} />
                </li>
              ))}
            </ul>
          ) : (
            <div className="empty">
              <h3>No match for “{term}”</h3>
              <p>Dollo covers 18 popular US companies in the sandbox. Try a company name like “Coca-Cola”, a ticker like “NVDA”, or a theme like “energy”.</p>
            </div>
          )}
        </section>
      ) : (
        <>
          <section className="section-tight" aria-labelledby="ins-h">
            <div className="section-head">
              <div>
                <h2 id="ins-h">Insider activity</h2>
                <p>Company leaders must report when they trade their own company’s stock. Here’s what they did recently.</p>
              </div>
              {feed.data?.source === 'sample' && <span className="badge">Sample data, not real filings</span>}
            </div>
            {feed.error && <LoadError error={feed.error} onRetry={feed.reload} />}
            <div className="insider-scroll" role="list">
              {feed.data
                ? feed.data.insiders.slice(0, 8).map((i) => (
                    <article key={i.id} className="insider" role="listitem">
                      <div className="insider-top">
                        <Ticker symbol={i.symbol} />
                        <span className={`badge ${i.type === 'buy' ? 'badge-gain' : 'badge-loss'}`}>{i.type === 'buy' ? 'Bought' : 'Sold'}</span>
                        <span className="muted insider-date">{relativeDay(i.filedAt)}</span>
                      </div>
                      <h3>{i.headline}</h3>
                      <p>{i.meaning}</p>
                      <div className="insider-foot">
                        <span className="num muted">
                          {i.quote && (
                            <>
                              {usd(i.quote.price)} <ChangeBadge value={i.quote.changePct} />
                            </>
                          )}
                        </span>
                        <Link to={`/stocks/${i.symbol}`} className="btn btn-sm">
                          View
                        </Link>
                      </div>
                    </article>
                  ))
                : [0, 1, 2].map((k) => <Skeleton key={k} h={200} />)}
            </div>
          </section>

          <section className="section" aria-labelledby="col-h">
            <div className="section-head">
              <div>
                <h2 id="col-h">Collections</h2>
                <p>Ideas grouped by theme. Start with one company or spread $1 across several.</p>
              </div>
            </div>
            {cols.error && <LoadError error={cols.error} onRetry={cols.reload} />}
            <div className="collections">
              {cols.data
                ? cols.data.collections.map((c) => (
                    <section key={c.id} className="panel collection" aria-labelledby={`c-${c.id}`}>
                      <Link to={`/discover/${c.id}`} className="collection-head">
                        <div>
                          <h3 id={`c-${c.id}`}>{c.name}</h3>
                          <p>{c.blurb}</p>
                        </div>
                        <ArrowRight aria-hidden="true" />
                      </Link>
                      <ul className="rows">
                        {c.stocks.slice(0, 3).map((s) => (
                          <li key={s.symbol}>
                            <StockRow s={s} />
                          </li>
                        ))}
                      </ul>
                      {c.stocks.length > 3 && (
                        <Link to={`/discover/${c.id}`} className="collection-more">
                          See all {c.stocks.length} companies
                        </Link>
                      )}
                    </section>
                  ))
                : [0, 1].map((k) => <Skeleton key={k} h={260} />)}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
