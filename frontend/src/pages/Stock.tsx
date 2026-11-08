import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CheckCircle2, ChevronLeft } from 'lucide-react';
import { api } from '../lib/api';
import { invalidate, useApi } from '../lib/useApi';
import { compactUsd, ngn, pct, shares, signedUsd, tone, usd } from '../lib/format';
import type { Order, Portfolio, Range, StockSnapshot } from '../lib/types';
import { PriceChart } from '../components/PriceChart';
import { Button, LoadError, Notice, Skeleton, Ticker } from '../components/ui';
import { Segmented } from '../components/motion';
import { Sheet } from '../components/Sheet';
import { haptic } from '../lib/motion';
import { useMedia } from '../lib/useMedia';

const RANGES: Range[] = ['1D', '1W', '1M', '3M', '1Y'];

export function StockPage() {
  const { symbol = '' } = useParams();
  const [range, setRange] = useState<Range>('1M');
  const [scrub, setScrub] = useState<{ t: number; p: number } | null>(null);
  const { data, error, reload } = useApi<{ stock: StockSnapshot }>(`/market/stocks/${encodeURIComponent(symbol)}?range=${range}`, { poll: 15_000 });
  const s = data?.stock;
  const wide = useMedia('(min-width: 900px)');
  const [sheet, setSheet] = useState<'buy' | 'sell' | null>(null);
  const pf = useApi<{ portfolio: Portfolio }>('/portfolio');
  const owned = pf.data?.portfolio.holdings.find((h) => h.symbol === s?.symbol);

  const first = s?.history[0]?.p;
  const shown = scrub?.p ?? s?.price ?? 0;
  const rangeChange = first ? shown - first : 0;
  const rangePct = first ? rangeChange / first : 0;

  return (
    <div className="page">
      <Link to="/discover" className="back-link">
        <ChevronLeft size={16} aria-hidden="true" /> Markets
      </Link>
      {error && <LoadError error={error} onRetry={reload} />}
      {!s && !error && (
        <div className="stack">
          <Skeleton h={52} w={260} />
          <Skeleton h={240} />
        </div>
      )}
      {s && (
        <div className="split">
          <div className="stack-l">
            <header className="stock-head">
              <Ticker symbol={s.symbol} large />
              <div>
                <h1>{s.name}</h1>
                <p className="muted">
                  {s.symbol} · {s.sector}
                </p>
              </div>
            </header>

            <section className="panel panel-pad stack" aria-label="Price">
              <div className="price-line">
                <span className="price num">{usd(shown)}</span>
                <span className={`num ${tone(rangeChange)}`}>
                  {signedUsd(rangeChange)} ({pct(rangePct)}) {scrub ? '' : range === '1D' ? 'today' : `past ${range}`}
                </span>
              </div>
              <PriceChart points={s.history} range={range} onScrub={setScrub} name={s.name} />
              <Segmented block label="Chart range" value={range} onChange={setRange} options={RANGES.map((r) => ({ value: r, label: r }))} />
              {s.quote.source === 'sandbox' && <p className="hint">Simulated sandbox prices, not live market data.</p>}
            </section>

            <section className="panel" aria-labelledby="snap-h">
              <div className="panel-head">
                <h2 id="snap-h">{s.name} in 60 seconds</h2>
              </div>
              <div className="panel-pad stack-l">
                <p className="about">{s.about}</p>
                <dl className="facts">
                  <div>
                    <dt>Size (market cap)</dt>
                    <dd className="num">{compactUsd(s.explain.marketCap.value)}</dd>
                    <p>{s.explain.marketCap.text}</p>
                  </div>
                  <div>
                    <dt>Revenue growth</dt>
                    <dd className={`num ${tone(s.explain.revenueGrowth.value)}`}>{pct(s.explain.revenueGrowth.value)}</dd>
                    <p>{s.explain.revenueGrowth.text} Compared with last year.</p>
                  </div>
                  <div>
                    <dt>Risk score</dt>
                    <dd className="num">
                      {s.explain.risk.score}/10 <span className="risk-label">{s.explain.risk.label}</span>
                    </dd>
                    <div className="risk-scale" aria-hidden="true">
                      {Array.from({ length: 10 }, (_, i) => (
                        <span key={i} data-on={i < s.explain.risk.score || undefined} />
                      ))}
                    </div>
                    <p>{s.explain.risk.text}</p>
                  </div>
                  <div>
                    <dt>Dividend</dt>
                    <dd className="num">{s.explain.dividend.value ? pct(s.explain.dividend.value, false) : 'None'}</dd>
                    <p>{s.explain.dividend.text}</p>
                  </div>
                </dl>
                {s.collections.length > 0 && (
                  <div className="cluster">
                    <span className="hint">In collections:</span>
                    {s.collections.map((c) => (
                      <Link key={c.id} to={`/discover/${c.id}`} className="chip chip-link">
                        {c.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </section>
          </div>

          {wide ? (
            <div className="sticky-col">
              <TradePanel stock={s} />
            </div>
          ) : (
            <div className="trade-bar">
              <div className="trade-bar-price num">
                <strong>{usd(s.price ?? 0)}</strong>
                <span className="muted">{owned ? `You own ${usd(owned.value)}` : 'From $1'}</span>
              </div>
              {owned && (
                <button type="button" className="btn" onClick={() => setSheet('sell')}>
                  Sell
                </button>
              )}
              <button type="button" className="btn btn-primary" onClick={() => setSheet('buy')}>
                Buy
              </button>
            </div>
          )}
        </div>
      )}
      {s && sheet && !wide && (
        <Sheet title={`${sheet === 'buy' ? 'Buy' : 'Sell'} ${s.name}`} onClose={() => setSheet(null)}>
          <TradePanel stock={s} initialSide={sheet} bare />
        </Sheet>
      )}
    </div>
  );
}

function TradePanel({ stock, initialSide = 'buy', bare }: { stock: StockSnapshot; initialSide?: 'buy' | 'sell'; bare?: boolean }) {
  const pf = useApi<{ portfolio: Portfolio }>('/portfolio');
  const fx = useApi<{ rate: number }>('/fx');
  const [side, setSide] = useState<'buy' | 'sell'>(initialSide);
  const [amount, setAmount] = useState('5');
  const [sellAll, setSellAll] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filled, setFilled] = useState<Order | null>(null);

  const firstRun = useRef(true);
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    setError(null);
    setSellAll(false);
  }, [side, stock.symbol]);

  const cash = pf.data?.portfolio.cash ?? 0;
  const position = pf.data?.portfolio.holdings.find((h) => h.symbol === stock.symbol);
  const amt = sellAll && position ? position.value : Number(amount) || 0;
  const estShares = stock.price ? amt / stock.price : 0;
  const limit = side === 'buy' ? cash : position?.value ?? 0;
  const tooLow = !sellAll && amt > 0 && amt < 1;
  const tooHigh = amt > limit + 1e-9;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const { order } = await api<{ order: Order }>('/orders', { body: sellAll ? { symbol: stock.symbol, side, all: true } : { symbol: stock.symbol, side, amount } });
      setFilled(order);
      haptic('success');
      invalidate();
    } catch (err) {
      haptic('error');
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (filled) {
    return (
      <section className={`${bare ? '' : 'panel panel-pad '}stack trade-done reveal`} aria-live="polite">
        <CheckCircle2 className="gain" size={28} aria-hidden="true" />
        <h2>
          {filled.side === 'buy' ? 'You bought' : 'You sold'} {usd(filled.notional)} of {stock.name}
        </h2>
        <dl className="dl">
          <div>
            <dt>Shares</dt>
            <dd>{shares(filled.shares)}</dd>
          </div>
          <div>
            <dt>Price per share</dt>
            <dd>{usd(filled.price)}</dd>
          </div>
          <div>
            <dt>Routed via</dt>
            <dd>{filled.broker === 'alpaca-paper' ? 'Alpaca (paper)' : 'Sandbox broker'}</dd>
          </div>
        </dl>
        <div className="cluster">
          <Button variant="primary" onClick={() => setFilled(null)}>
            Place another order
          </Button>
          <Link to="/" className="btn">
            See portfolio
          </Link>
        </div>
      </section>
    );
  }

  return (
    <form className={`${bare ? '' : 'panel panel-pad '}stack-l trade`} onSubmit={submit} aria-label={side === 'buy' ? `Buy ${stock.name}` : `Sell ${stock.name}`}>
      <div className="stack-s">
        {!bare && (
          <h2 className="field-label">
            {side === 'buy' ? `Buy ${stock.name}` : `Sell ${stock.name}`}
          </h2>
        )}
        <Segmented
          block
          label="Order side"
          value={side}
          onChange={setSide}
          options={[
            { value: 'buy', label: 'Buy' },
            { value: 'sell', label: 'Sell', disabled: !position },
          ]}
        />
      </div>

      <div className="field">
        <div className="cluster" style={{ justifyContent: 'space-between' }}>
          <label htmlFor="amt">Amount in dollars</label>
          <span className="hint num">{side === 'buy' ? `${usd(cash)} available` : `You own ${usd(position?.value ?? 0)}`}</span>
        </div>
        <div className="amount-input">
          <span aria-hidden="true">$</span>
          <input
            id="amt"
            inputMode="decimal"
            value={sellAll && position ? position.value.toFixed(2) : amount}
            onChange={(e) => {
              setSellAll(false);
              setAmount(e.target.value.replace(/[^\d.]/g, ''));
            }}
            aria-invalid={tooLow || tooHigh || undefined}
            aria-describedby="amt-help"
          />
        </div>
        <div className="chips">
          {[1, 5, 10, 25].map((v) => (
            <button key={v} type="button" className="chip" aria-pressed={!sellAll && Number(amount) === v} onClick={() => { setSellAll(false); setAmount(String(v)); }}>
              {usd(v).replace('.00', '')}
            </button>
          ))}
          {side === 'sell' && position && (
            <button type="button" className="chip" aria-pressed={sellAll} onClick={() => setSellAll(true)}>
              Sell all
            </button>
          )}
        </div>
        <span id="amt-help" className={tooLow || tooHigh ? 'error' : 'hint'}>
          {tooLow
            ? 'The minimum order is $1.'
            : tooHigh
              ? side === 'buy'
                ? `You have ${usd(cash)}. Deposit USDT to add more.`
                : `Your ${stock.name} is worth ${usd(position?.value ?? 0)}.`
              : 'Orders start at $1. You don’t need to afford a whole share.'}
        </span>
      </div>

      <dl className="dl">
        <div>
          <dt>Estimated shares</dt>
          <dd>{shares(estShares)}</dd>
        </div>
        <div>
          <dt>Price per share</dt>
          <dd>{stock.price ? usd(stock.price) : '—'}</dd>
        </div>
        <div>
          <dt>In naira</dt>
          <dd>{fx.data ? `≈ ${ngn(amt * fx.data.rate)}` : '…'}</dd>
        </div>
        <div>
          <dt>Commission</dt>
          <dd>$0.00</dd>
        </div>
      </dl>

      {error && <Notice kind="error">{error}</Notice>}
      {side === 'buy' && cash < 1 && pf.data && (
        <Notice>
          Your USD balance is empty. <Link to="/fund">Deposit USDT</Link> to start investing.
        </Notice>
      )}
      <Button variant="primary" type="submit" block loading={busy} disabled={!amt || tooLow || tooHigh}>
        {side === 'buy' ? `Buy ${usd(amt)} of ${stock.symbol}` : `Sell ${usd(amt)} of ${stock.symbol}`}
      </Button>
      <p className="hint">Market order at the next available price. Executed and held by a licensed US broker-dealer.</p>
    </form>
  );
}
