import { useMemo, useRef, useState } from 'react';
import type { Range } from '../lib/types';

const W = 640;
const H = 220;
const PAD_T = 12;
const PAD_B = 12;

function label(t: number, range: Range) {
  const d = new Date(t);
  if (range === '1D') return d.toLocaleTimeString('en-NG', { hour: 'numeric', minute: '2-digit' });
  if (range === '1W') return d.toLocaleString('en-NG', { weekday: 'short', hour: 'numeric', minute: '2-digit' });
  return d.toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: range === '1Y' ? 'numeric' : undefined });
}

/** Single-series price line with a crosshair. Reports the scrubbed point so the header can show it. */
export function PriceChart({
  points,
  range,
  onScrub,
  name,
}: {
  points: { t: number; p: number }[];
  range: Range;
  onScrub: (pt: { t: number; p: number } | null) => void;
  name: string;
}) {
  const ref = useRef<SVGSVGElement>(null);
  const [hover, setHover] = useState<number | null>(null);

  const geo = useMemo(() => {
    const ps = points.map((x) => x.p);
    const min = Math.min(...ps);
    const max = Math.max(...ps);
    const span = max - min || 1;
    const x = (i: number) => (i / Math.max(points.length - 1, 1)) * W;
    const y = (p: number) => PAD_T + (1 - (p - min) / span) * (H - PAD_T - PAD_B);
    const d = points.map((pt, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(pt.p).toFixed(1)}`).join('');
    const base = y(points[0]?.p ?? 0);
    return { d, x, y, min, max, base };
  }, [points]);

  const pick = (clientX: number) => {
    const el = ref.current;
    if (!el || !points.length) return;
    const r = el.getBoundingClientRect();
    const i = Math.round(((clientX - r.left) / r.width) * (points.length - 1));
    const idx = Math.max(0, Math.min(points.length - 1, i));
    setHover(idx);
    onScrub(points[idx]);
  };

  const clear = () => {
    setHover(null);
    onScrub(null);
  };

  const hp = hover != null ? points[hover] : null;
  const first = points[0];
  const last = points[points.length - 1];

  return (
    <figure className="chart">
      <svg
        ref={ref}
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        role="img"
        aria-label={`${name} price, ${range}: from $${first?.p.toFixed(2)} to $${last?.p.toFixed(2)}`}
        onPointerMove={(e) => pick(e.clientX)}
        onPointerDown={(e) => pick(e.clientX)}
        onPointerLeave={clear}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
          e.preventDefault();
          const next = Math.max(0, Math.min(points.length - 1, (hover ?? points.length - 1) + (e.key === 'ArrowLeft' ? -1 : 1)));
          setHover(next);
          onScrub(points[next]);
        }}
        onBlur={clear}
      >
        <line x1="0" x2={W} y1={geo.base} y2={geo.base} className="chart-base" vectorEffect="non-scaling-stroke" />
        <path d={geo.d} className="chart-line" vectorEffect="non-scaling-stroke" />
        {hp && hover != null && (
          <line x1={geo.x(hover)} x2={geo.x(hover)} y1="0" y2={H} className="chart-cross" vectorEffect="non-scaling-stroke" />
        )}
      </svg>
      {hp && hover != null && (
        <span
          className="chart-dot"
          style={{ left: `${(hover / Math.max(points.length - 1, 1)) * 100}%`, top: `${(geo.y(hp.p) / H) * 100}%` }}
          aria-hidden="true"
        />
      )}
      <figcaption className="chart-axis">
        <span>{first ? label(first.t, range) : ''}</span>
        <span>{hp ? label(hp.t, range) : 'Now'}</span>
      </figcaption>
    </figure>
  );
}
