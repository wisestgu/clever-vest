import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import { useApi } from '../lib/useApi';
import { compactUsd, pct, relativeDay, tone, usd } from '../lib/format';
import type { Collection, InsiderTrade, Listing } from '../lib/types';
import { LoadError, Skeleton, Ticker } from '../components/ui';
import { Note, type Tint } from '../components/Note';

const TINT: Record<string, Tint> = { 'ai-revolution': 'violet', 'dividend-payers': 'copper', 'clean-energy': 'green', 'everyday-brands': 'blue' };

export function StockRow({ s }: { s: Listing }) {
  return (
    <Link to={`/stocks/${s.symbol}`} className="ledger-row">
      <Ticker symbol={s.symbol} />
      <span className="ledger-main">
        <span className="ledger-title">{s.name}</span>
        <span className="ledger-sub">
          {s.sector} · risk {s.risk}/10
        </span>
      </span>
      <span className="ledger-end num">
        <strong>{s.price != null ? usd(s.price) : '—'}</strong>
        <small className={tone(s.changePct)}>{s.changePct != null ? pct(s.changePct) : ''}</small>
      </span>
    </Link>
  );
}

export function Discover() {
  const [q, setQ] = useState('');
  const [term, setTerm] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setTerm(q.trim()), 120);
    return () => clearTimeout(t);
  }, [q]);

  const feed = useApi<{ insiders: InsiderTrade[]; source: string }>('/market/feed');
  const cols = useApi<{ collections: Collection[] }>('/market/collections', { poll: 30_000 });
  const results = useApi<{ results: Listing[] }>(term ? `/market/search?q=${encodeURIComponent(term)}` : null);

  return (
    <div className="page">
      <header className="page-title">
        <h1>Markets</h1>
        <div className="search">
          <Search aria-hidden="true" />
          <label htmlFor="q" className="visually-hidden">
            Search stocks
          </label>
          <input id="q" className="input" type="search" placeholder="Apple, TSLA, clean energy…" value={q} onChange={(e) => setQ(e.target.value)} autoComplete="off" />
        </div>
      </header>

      {term ? (
        <section aria-live="polite" aria-label="Search results">
          {results.loading && !results.data ? (
            <Skeleton h={160} />
          ) : results.data?.results.length ? (
            <ul className="ledger">
              {results.data.results.map((s) => (
                <li key={s.symbol}>
                  <StockRow s={s} />
                </li>
              ))}
            </ul>
          ) : (
            <div className="empty sheet-plain">
              <h3>Nothing matches “{term}”</h3>
              <p>The sandbox covers 18 US companies. Try a name like “Coca-Cola”, a ticker like “NVDA”, or a theme like “energy”.</p>
            </div>
          )}
        </section>
      ) : (
        <>
          <section aria-labelledby="col-h">
            <div className="section-head">
              <h2 id="col-h">Collections</h2>
              <p className="muted">Themes printed as notes. Open one to see every company inside.</p>
            </div>
            {cols.error && <LoadError error={cols.error} onRetry={cols.reload} />}
            <div className="notes-rail">
              {cols.data
                ? cols.data.collections.map((c) => {
                    const up = c.stocks.filter((s) => (s.changePct ?? 0) > 0).length;
                    return (
                      <Link key={c.id} to={`/discover/${c.id}`} className="note-link" aria-label={`${c.name}: ${c.stocks.length} companies`}>
                        <Note seed={c.id} tint={TINT[c.id] ?? 'green'} size="mini" micro={c.name.toUpperCase()} corner={String(c.stocks.length)} as="article">
                          <span className="note-label">{c.stocks.length} companies</span>
                          <h3 className="mini-title">{c.name}</h3>
                          <p className="mini-sub">{c.blurb}</p>
                          <span className="mini-foot num">
                            {c.symbols.slice(0, 3).join(' · ')}
                            <span>
                              {up}/{c.stocks.length} up
                            </span>
                          </span>
                        </Note>
                      </Link>
                    );
                  })
                : [0, 1, 2].map((k) => <Skeleton key={k} h={190} r={14} />)}
            </div>
          </section>

          <section className="section" aria-labelledby="ins-h">
            <div className="section-head">
              <h2 id="ins-h">Insider wire</h2>
              <p className="muted">When company leaders trade their own stock, they must report it. Here’s what they did, in plain English.</p>
            </div>
            {feed.error && <LoadError error={feed.error} onRetry={feed.reload} />}
            {feed.data ? (
              <ul className="wire wire-full">
                {feed.data.insiders.map((i) => (
                  <li key={i.id}>
                    <Link to={`/stocks/${i.symbol}`} className="wire-row" data-side={i.type}>
                      <span className="wire-side" aria-hidden="true">
                        {i.type === 'buy' ? 'BUY' : 'SELL'}
                      </span>
                      <span className="wire-text">
                        {i.headline}
                        <span className="wire-meaning">{i.meaning}</span>
                      </span>
                      <span className="wire-figure num">
                        {compactUsd(i.value)}
                        <small className={tone(i.quote?.changePct)}>{i.quote ? `${usd(i.quote.price)} ${pct(i.quote.changePct)}` : ''}</small>
                      </span>
                      <span className="wire-date">{relativeDay(i.filedAt)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <Skeleton h={260} />
            )}
            {feed.data?.source === 'sample' && <p className="hint">Sample filings generated for the sandbox. They are not real trades.</p>}
          </section>
        </>
      )}
    </div>
  );
}
