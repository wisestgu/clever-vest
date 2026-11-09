import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { MemoryRouter } from 'react-router-dom';
import { CheckCircle2, Check } from 'lucide-react';

// The real Dollo design system and components.
import '@fontsource-variable/schibsted-grotesk';
import '@fontsource-variable/bodoni-moda/opsz.css';
import '@fontsource-variable/geist-mono';
import '../../../frontend/src/styles/app.css';
import '../../../frontend/src/styles/screens.css';
import { Note } from '../../../frontend/src/components/Note';
import { Rosette, WaveBand } from '../../../frontend/src/components/Guilloche';
import { Coin } from '../../../frontend/src/components/Coin';
import { MoneyRoute } from '../../../frontend/src/components/MoneyRoute';
import { Logo, Qr, Ticker } from '../../../frontend/src/components/ui';
import './video.css';

/* ------------------------------------------------------------------ */
/* Time helpers: every frame is a pure function of t (seconds).        */
/* ------------------------------------------------------------------ */
export const DURATION = 24;
const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const prog = (t: number, a: number, b: number) => clamp((t - a) / (b - a));
const easeOut = (x: number) => 1 - Math.pow(1 - clamp(x), 4);
const inOut = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
/** Critically damped spring response (Apple damping 1.0). */
const crit = (x: number) => {
  const c = clamp(x);
  return 1 - (1 + 7 * c) * Math.exp(-7 * c);
};
/** Under-damped response for things that land with momentum (damping ~0.6). */
const landed = (x: number) => {
  const c = clamp(x);
  return 1 - Math.exp(-5.5 * c) * Math.cos(11 * c);
};
const lerp = (a: number, b: number, x: number) => a + (b - a) * x;

/** Enter (rise + fade) at `start`, leave at `end`. */
function rise(t: number, start: number, end: number, dy = 34, dur = 0.5): CSSProperties {
  const a = crit((t - start) / dur);
  const l = easeOut((t - (end - 0.22)) / 0.22);
  if (t < start) return { opacity: 0, transform: `translateY(${dy}px)` };
  return { opacity: a * (1 - l), transform: `translateY(${(1 - a) * dy - l * 22}px)` };
}

function Caption({ t, start, end, text }: { t: number; start: number; end: number; text: string }) {
  const words = text.split(' ');
  const l = easeOut((t - (end - 0.24)) / 0.24);
  return (
    <h2 className="v-caption" style={{ opacity: 1 - l, transform: `translateY(${-l * 24}px)` }}>
      {words.map((w, i) => {
        const a = crit((t - start - i * 0.045) / 0.5);
        return (
          <span key={i} className="v-word" style={{ opacity: t < start ? 0 : a, transform: `translateY(${(1 - a) * 0.5}em)` }}>
            {w}{' '}
          </span>
        );
      })}
    </h2>
  );
}

function Tap({ t, at }: { t: number; at: number }) {
  const p = (t - at) / 0.42;
  if (p < 0 || p > 1) return null;
  return <span className="v-tap" style={{ opacity: 1 - p, transform: `translate(-50%, -50%) scale(${0.55 + p * 0.9})` }} />;
}

const on = (t: number, a: number, b: number) => t >= a - 0.3 && t < b + 0.3;

/* ------------------------------------------------------------------ */
/* Background: security paper with a slow-turning guilloche watermark  */
/* ------------------------------------------------------------------ */
function Paper({ t }: { t: number }) {
  return (
    <div className="v-paper" aria-hidden="true">
      <div className="v-wm v-wm-a" style={{ transform: `rotate(${t * 3}deg)` }}>
        <Rosette seed="brag-watermark-a" layers={6} stroke={0.6} />
      </div>
      <div className="v-wm v-wm-b" style={{ transform: `rotate(${-t * 2}deg)` }}>
        <Rosette seed="brag-watermark-b" layers={5} stroke={0.6} />
      </div>
      <WaveBand width={1920} height={40} lines={5} waves={18} seed="brag-band" className="v-band" />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Scene 1 — Hook: a $1 note engraves itself                          */
/* ------------------------------------------------------------------ */
function Hook({ t }: { t: number }) {
  if (!on(t, 0, 3)) return null;
  const draw = 1 - easeOut(prog(t, 0.05, 1.55));
  const card = crit(t / 0.6);
  const stamp = landed((t - 1.5) / 0.55);
  const out = easeOut(prog(t, 2.78, 3.0));
  return (
    <div className="v-scene v-center">
      <div
        className="v-hook-note engrave"
        style={{ ['--draw' as string]: draw, opacity: card * (1 - out), transform: `translateY(${(1 - card) * 40 - out * 30}px) scale(${lerp(0.96, 1, card) - out * 0.04})` }}
      >
        <Note seed="welcome-one-dollar" micro="DOLLO · ONE DOLLAR · ỌKAN DỌLA · OTU DOLLAR · DALA ƊAYA" serial="DL 0000 000001" corner="1">
          <span className="note-label" style={{ opacity: clamp((t - 1.75) / 0.3) }}>
            The smallest amount you can invest
          </span>
          <span className="denom denom-xl num" style={{ opacity: t < 1.5 ? 0 : clamp(stamp * 1.4), transform: `scale(${t < 1.5 ? 1.7 : lerp(1.7, 1, stamp)})`, transformOrigin: 'left bottom', display: 'inline-block' }}>
            $1
          </span>
        </Note>
      </div>
      <div className="v-hook-cap">
        <Caption t={t} start={1.0} end={3.0} text="Own US stocks from $1." />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Scene 2 — Reveal: Dollo and the route                              */
/* ------------------------------------------------------------------ */
function Reveal({ t }: { t: number }) {
  if (!on(t, 3, 6)) return null;
  const logo = landed((t - 3.0) / 0.6);
  const out = easeOut(prog(t, 5.78, 6.0));
  const line = inOut(prog(t, 3.9, 5.1));
  const stops = [
    { at: 4.0, label: 'USDT in', sub: 'Tron · Ethereum' },
    { at: 4.5, label: 'US stocks', sub: 'From $1 a slice' },
    { at: 5.0, label: 'Naira out', sub: 'To any Nigerian bank' },
  ];
  return (
    <div className="v-scene v-center" style={{ opacity: 1 - out, transform: `translateY(${-out * 24}px)` }}>
      <div className="v-lockup" style={{ opacity: t < 3 ? 0 : clamp(logo * 1.3), transform: `scale(${t < 3 ? 0.8 : lerp(0.8, 1, logo)})` }}>
        <span className="v-logo" style={{ transform: `rotate(${(1 - crit((t - 3) / 0.9)) * -90}deg)` }}>
          <Logo />
        </span>
        <span className="v-wordmark">Dollo</span>
      </div>
      <p className="v-tagline" style={rise(t, 3.35, 99, 20)}>
        The dollar investing app for Nigeria.
      </p>
      <div className="v-stations">
        <div className="v-stations-line" style={{ clipPath: `inset(0 ${(1 - line) * 100}% 0 0)` }}>
          <WaveBand width={1000} height={16} lines={3} waves={24} seed="route" className="v-stations-wave" />
        </div>
        {stops.map((s, i) => {
          const a = landed((t - s.at) / 0.5);
          return (
            <div key={s.label} className="v-station" style={{ opacity: t < s.at ? 0 : clamp(a * 1.5) }}>
              <span className="route-node v-node" style={{ transform: `scale(${t < s.at ? 0.4 : lerp(0.4, 1, a)})` }}>
                {i + 1}
              </span>
              <span className="v-station-label">{s.label}</span>
              <span className="v-station-sub">{s.sub}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Scene 3 — USDT in                                                   */
/* ------------------------------------------------------------------ */
function Deposit({ t }: { t: number }) {
  if (!on(t, 6, 10)) return null;
  const conf = Math.round(lerp(4, 19, inOut(prog(t, 7.1, 8.5))));
  const credited = t >= 8.5;
  const swap = t >= 8.75;
  const routeP = crit((t - 8.9) / 0.5);
  const usdt = 25 * easeOut(prog(t, 8.95, 9.5));
  const usd = 25 * easeOut(prog(t, 9.15, 9.75));
  return (
    <div className="v-scene v-split">
      <div className="v-left">
        <Caption t={t} start={6.15} end={10} text="Send USDT on Tron. It lands as dollars, 1:1." />
      </div>
      <div className="v-right">
        {!swap ? (
          <div className="v-stage" style={rise(t, 6.2, 8.75)}>
            <div className="v-zoom">
              <div className="stack">
                <div className="network-pick v-net">
                  <button type="button" role="radio" aria-checked="true" className="network-opt">
                    <span className="network-name">
                      TRC20 <span className="muted">· Tron</span>
                    </span>
                    <span className="network-meta">Fee ≈ $1 · ~1 min · min 1 USDT</span>
                    <span className="badge badge-gain">Cheapest</span>
                  </button>
                  <button type="button" role="radio" aria-checked="false" className="network-opt">
                    <span className="network-name">
                      ERC20 <span className="muted">· Ethereum</span>
                    </span>
                    <span className="network-meta">Fee ≈ $4 · ~3 min · min 10 USDT</span>
                  </button>
                </div>
                <div className="panel panel-pad v-addr">
                  <div className="address-block" style={{ marginTop: 0 }}>
                    <Qr value="TQ5uXqJyKs8wFdMhnVZp3rB7tLcE2aW9Rf" label="Deposit address" />
                    <div className="stack-s address-text">
                      <span className="field-label">Your TRC20 address</span>
                      <div className="address-row">
                        <code className="mono address">TQ5uXqJyKs8wFdMhnVZp3rB7tLcE2aW9Rf</code>
                      </div>
                      <span className="hint">Sandbox address shown for the demo.</span>
                    </div>
                  </div>
                </div>
                <ul className="rows panel v-deprow" style={rise(t, 7.0, 99, 24, 0.4)}>
                  <li className="row deposit-row">
                    {credited ? <CheckCircle2 className="gain" aria-hidden="true" /> : <span className="v-clock" />}
                    <div className="row-main">
                      <div className="row-title num">25.00 USDT</div>
                      <div className="row-sub">{credited ? 'Credited to your dollars' : `Confirming on Tron · ${conf}/19`}</div>
                      {!credited && (
                        <div className="meter">
                          <span style={{ transform: `scaleX(${conf / 19})`, transition: 'none' }} />
                        </div>
                      )}
                    </div>
                    <span className={`badge ${credited ? 'badge-gain' : 'badge-pending'}`}>{credited ? '+$25.00' : 'Pending'}</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        ) : (
          <div className="v-stage v-route-stage" style={{ opacity: routeP * (1 - easeOut(prog(t, 9.78, 10))), transform: `translateY(${(1 - routeP) * 30}px)` }}>
            <div className="v-zoom-route">
              <MoneyRoute route={{ usdtIn: usdt, usdtPending: 0, usd, stocks: 0, ngnOut: 0 }} />
              <div className="v-pulse-track">
                <span className="v-pulse" style={{ left: `${lerp(0, 33.3, inOut(prog(t, 8.95, 9.75)))}%`, opacity: t > 8.95 && t < 9.8 ? 1 : 0 }} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Scene 4 — Market feed → $5 Tesla                                    */
/* ------------------------------------------------------------------ */
const CHART = (() => {
  const pts: number[] = [];
  let v = 214;
  for (let i = 0; i < 60; i++) {
    const n = Math.sin(i * 1.7) * 2.6 + Math.sin(i * 0.53) * 4.1 + Math.cos(i * 2.9) * 1.4;
    v += 1.18 + n * 0.5;
    pts.push(v + n);
  }
  const k = 282.44 / pts[pts.length - 1];
  return pts.map((p) => p * k);
})();

function chartPath(w: number, h: number) {
  const min = Math.min(...CHART);
  const max = Math.max(...CHART);
  return CHART.map((p, i) => `${i ? 'L' : 'M'}${((i / (CHART.length - 1)) * w).toFixed(1)},${(8 + (1 - (p - min) / (max - min)) * (h - 16)).toFixed(1)}`).join('');
}

function Buy({ t }: { t: number }) {
  if (!on(t, 10, 14)) return null;
  const stamp = landed((t - 10.5) / 0.5);
  const toStock = t >= 11.3;
  const draw = inOut(prog(t, 11.45, 12.3));
  const chip5 = t >= 12.15;
  const pressBtn = t >= 12.65 && t < 12.85;
  const done = t >= 12.9;
  return (
    <div className="v-scene v-split">
      <div className="v-left">
        <Caption t={t} start={10.15} end={14} text="Insider moves in plain English. Buy a $5 slice." />
      </div>
      <div className="v-right">
        {!toStock ? (
          <div className="v-stage" style={rise(t, 10.15, 11.3)}>
            <div className="v-zoom">
              <ul className="wire">
                <li>
                  <div className="wire-row v-host" data-side="buy">
                    <Tap t={t} at={11.0} />
                    <span className="wire-side" style={{ opacity: t < 10.5 ? 0 : clamp(stamp * 1.6), transform: `rotate(-4deg) scale(${t < 10.5 ? 2.2 : lerp(2.2, 1, stamp)})` }}>
                      BUY
                    </span>
                    <span className="wire-text">
                      Tesla’s CEO bought $2.3M of Tesla stock
                      <span className="wire-meaning">Insiders usually buy with their own money when they expect the price to rise. A clue, not a guarantee.</span>
                    </span>
                    <span className="wire-figure num">$2.3M</span>
                    <span className="wire-date">Friday</span>
                  </div>
                </li>
                <li>
                  <div className="wire-row" data-side="buy" style={{ opacity: 0.55 }}>
                    <span className="wire-side">BUY</span>
                    <span className="wire-text">A director at NVIDIA bought $1.3M of NVIDIA stock</span>
                    <span className="wire-figure num">$1.3M</span>
                    <span className="wire-date">Yesterday</span>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="v-stage" style={rise(t, 11.3, 14)}>
            <div className="v-zoom v-zoom-tight">
              <div className="panel panel-pad stack v-stock">
                <header className="stock-head">
                  <Ticker symbol="TSLA" large />
                  <h3 className="v-stock-name">Tesla</h3>
                </header>
                <div className="price-line">
                  <span className="price num">$282.44</span>
                  <span className="gain num">+$67.22 (+31.2%) past 1M</span>
                </div>
                <svg className="v-chart" viewBox="0 0 600 150" preserveAspectRatio="none">
                  <path d={chartPath(600, 150)} className="chart-line" pathLength={1} style={{ strokeDasharray: 1, strokeDashoffset: 1 - draw }} />
                </svg>
                {!done ? (
                  <>
                    <div className="chips">
                      {['$1', '$5', '$10', '$25'].map((c) => (
                        <button key={c} type="button" className="chip v-host" aria-pressed={chip5 && c === '$5'}>
                          {c}
                          {c === '$5' && <Tap t={t} at={12.15} />}
                        </button>
                      ))}
                    </div>
                    <button type="button" className="btn btn-primary btn-block" style={{ transform: pressBtn ? 'scale(0.97)' : undefined, background: pressBtn ? 'var(--primary-press)' : undefined }}>
                      {chip5 ? 'Buy $5.00 of TSLA' : 'Buy TSLA'}
                      <Tap t={t} at={12.65} />
                    </button>
                  </>
                ) : (
                  <div className="v-done" style={rise(t, 12.9, 99, 18, 0.4)}>
                    <CheckCircle2 className="gain" size={30} aria-hidden="true" />
                    <span className="v-done-title">You bought $5.00 of Tesla</span>
                    <span className="v-done-sub num">0.0177 shares at $282.44 · $0 commission</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Scene 5 — Learn & earn                                              */
/* ------------------------------------------------------------------ */
function Learn({ t }: { t: number }) {
  if (!on(t, 14, 17)) return null;
  const answered = t >= 14.75;
  const toCoin = t >= 15.45;
  const drop = landed((t - 15.55) / 0.7);
  return (
    <div className="v-scene v-split">
      <div className="v-left">
        <Caption t={t} start={14.15} end={17} text="Learn in 60 seconds. Earn real stock." />
      </div>
      <div className="v-right">
        {!toCoin ? (
          <div className="v-stage" style={rise(t, 14.15, 15.45)}>
            <div className="v-zoom">
              <section className="panel panel-pad stack-l v-quiz">
                <div className="stack-s">
                  <span className="hint num">Question 1 of 3 · TRC20 vs ERC20</span>
                  <h3 className="v-quiz-q">What does TRC20 refer to?</h3>
                </div>
                <div className="options">
                  {['The Tron network', 'A Nigerian bank code', 'An Ethereum wallet'].map((o, i) => (
                    <button key={o} type="button" className="option v-host" data-state={answered ? (i === 0 ? 'right' : 'idle') : 'idle'} disabled={answered}>
                      {i === 0 && <Tap t={t} at={14.7} />}
                      <span>{o}</span>
                      {answered && i === 0 && <Check aria-hidden="true" />}
                    </button>
                  ))}
                </div>
              </section>
            </div>
          </div>
        ) : (
          <div className="v-stage v-center-col" style={{ opacity: 1 - easeOut(prog(t, 16.78, 17)) }}>
            <div className="v-coin-drop" style={{ opacity: clamp((t - 15.5) / 0.15), transform: `translateY(${(1 - drop) * -260}px) rotate(${(1 - drop) * -40}deg)` }}>
              <Coin value="$1" seed="networks" size={210} earned />
            </div>
            <div className="v-purse">
              {['stablecoins', 'networks', 'fractional', 'snapshot', 'insiders'].map((id, i) => (
                <Coin key={id} value="$1" seed={id} size={62} earned={i === 0 || (i === 1 && t >= 15.95)} />
              ))}
            </div>
            <p className="v-earned" style={rise(t, 15.9, 99, 18)}>
              $1 of NVIDIA, earned.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Scene 6 — Naira out (hold to send)                                  */
/* ------------------------------------------------------------------ */
function Naira({ t }: { t: number }) {
  if (!on(t, 17, 20)) return null;
  const hold = clamp((t - 17.55) / 1.4);
  const sent = t >= 19.0;
  return (
    <div className="v-scene v-split">
      <div className="v-left">
        <Caption t={t} start={17.15} end={20} text="Cash out to any Nigerian bank." />
      </div>
      <div className="v-right">
        <div className="v-stage" style={rise(t, 17.15, 20)}>
          <div className="v-zoom">
            <aside className="panel panel-pad stack v-naira">
              {!sent ? (
                <>
                  <span className="field-label">You’ll receive</span>
                  <p className="receive num">₦14,405.61</p>
                  <dl className="dl">
                    <div>
                      <dt>You send</dt>
                      <dd>$10.00</dd>
                    </div>
                    <div>
                      <dt>Dollo fee (1%, min $0.50)</dt>
                      <dd>−$0.50</dd>
                    </div>
                    <div>
                      <dt>Rate</dt>
                      <dd>$1 = ₦1,516.38</dd>
                    </div>
                  </dl>
                  <div className="review">
                    <strong>Send ₦14,405.61 to ADAEZE OKAFOR</strong>
                    <span>Guaranty Trust Bank ····6789. Payouts can’t be reversed once sent.</span>
                  </div>
                  <button type="button" className="btn btn-primary btn-block hold" style={{ transform: hold > 0 && hold < 1 ? 'scale(0.97)' : undefined }}>
                    <span className="hold-label">Hold to send ₦14,406</span>
                    <span className="hold-fill" style={{ clipPath: `inset(0 ${(1 - hold) * 100}% 0 0)`, transition: 'none' }}>
                      <span className="hold-label">Hold to send ₦14,406</span>
                    </span>
                  </button>
                </>
              ) : (
                <div className="v-sent" style={rise(t, 19.0, 99, 18, 0.45)}>
                  <CheckCircle2 className="gain" size={44} aria-hidden="true" />
                  <span className="v-sent-title">Naira sent</span>
                  <span className="receive num">₦14,405.61</span>
                  <span className="muted">Paid to ADAEZE OKAFOR · Guaranty Trust Bank ····6789</span>
                </div>
              )}
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Scene 7 — Outro                                                     */
/* ------------------------------------------------------------------ */
function Outro({ t }: { t: number }) {
  if (!on(t, 20, 24)) return null;
  const inP = crit((t - 20.05) / 0.6);
  const outP = easeOut(prog(t, 21.75, 22.0));
  const lock = landed((t - 22.0) / 0.6);
  const tilt = Math.sin((t - 20) * 1.6);
  return (
    <div className="v-scene v-center">
      {t < 22.05 && (
        <div className="v-outro-note" style={{ opacity: inP * (1 - outP), transform: `translateY(${(1 - inP) * 40 - outP * 30}px) scale(${1 - outP * 0.05})` }}>
          <div className="v-tilt" style={{ transform: `perspective(1200px) rotateY(${tilt * 7}deg) rotateX(${Math.cos((t - 20) * 1.3) * 3}deg)`, ['--foil' as string]: `${50 + tilt * 50}%` }}>
            <Note seed="usr_demo_portfolio" micro="DOLLO · ONE DOLLAR · ỌKAN DỌLA · OTU DOLLAR · DALA ƊAYA" serial="DL 4021 573910" corner="$">
              <span className="note-label">Adaeze’s portfolio</span>
              <h3 className="denom num">$16.00</h3>
              <p className="note-sub num">
                <span>$6.00 in US stocks · $10.00 ready · ₦14,405.61 cashed out</span>
              </p>
            </Note>
          </div>
          <div className="v-zoom-route-out">
            <MoneyRoute route={{ usdtIn: 25, usdtPending: 0, usd: 10, stocks: 6, ngnOut: 14405.61 }} />
          </div>
        </div>
      )}
      {t >= 21.95 && (
        <div className="v-final" style={{ opacity: clamp(lock * 1.3) }}>
          <div className="v-lockup" style={{ transform: `scale(${lerp(0.86, 1, lock)})` }}>
            <span className="v-logo">
              <Logo />
            </span>
            <span className="v-wordmark">Dollo</span>
          </div>
          <p className="v-final-line" style={rise(t, 22.2, 99, 18)}>
            USDT in. US stocks. Naira out.
          </p>
          <p className="v-fine" style={rise(t, 22.55, 99, 12)}>
            Built on Cleva + Tether rails · Stocks via a licensed US broker · Sandbox demo
          </p>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
function Video() {
  const [t, setT] = useState(() => Number(new URLSearchParams(location.search).get('t') ?? 0));
  useEffect(() => {
    (window as unknown as { __seek: (n: number) => void }).__seek = (n: number) => flushSync(() => setT(n));
    (window as unknown as { __ready: boolean }).__ready = true;
  }, []);
  return (
    <MemoryRouter>
      <div className="vid">
        <Paper t={t} />
        <Hook t={t} />
        <Reveal t={t} />
        <Deposit t={t} />
        <Buy t={t} />
        <Learn t={t} />
        <Naira t={t} />
        <Outro t={t} />
      </div>
    </MemoryRouter>
  );
}

createRoot(document.getElementById('root')!).render(<Video />);

export type { ReactNode };
