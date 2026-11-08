import { memo, useMemo } from 'react';

// Security-print guilloche, generated: the engraved rosettes and woven bands printed on banknotes.
// Rosettes are layered hypotrochoids; bands are interleaved sine waves. Deterministic per seed.

function hash(str: string) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function rand(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a);

function hypotrochoid(R: number, r: number, d: number, rot: number, scale: number, steps = 720) {
  const turns = r / gcd(R, r);
  const total = Math.PI * 2 * turns;
  const k = (R - r) / r;
  let out = '';
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * total;
    const x = (R - r) * Math.cos(t) + d * Math.cos(k * t);
    const y = (R - r) * Math.sin(t) - d * Math.sin(k * t);
    const xr = (x * Math.cos(rot) - y * Math.sin(rot)) * scale;
    const yr = (x * Math.sin(rot) + y * Math.cos(rot)) * scale;
    out += `${i ? 'L' : 'M'}${xr.toFixed(2)} ${yr.toFixed(2)}`;
  }
  return out;
}

export function rosettePaths(seed: string, layers = 7) {
  const r = rand(hash(seed));
  const R = 96 + Math.floor(r() * 24);
  const small = [17, 19, 23, 29, 31, 37][Math.floor(r() * 6)];
  const paths: string[] = [];
  for (let i = 0; i < layers; i++) {
    const d = small * (1.4 + i * 0.22 + r() * 0.1);
    const reach = R - small + d;
    paths.push(hypotrochoid(R, small, d, (i * Math.PI) / (layers * 3.1), 96 / reach));
  }
  return paths;
}

export const Rosette = memo(function Rosette({ seed, className, layers = 7, stroke = 0.45 }: { seed: string; className?: string; layers?: number; stroke?: number }) {
  const paths = useMemo(() => rosettePaths(seed, layers), [seed, layers]);
  return (
    <svg className={className} viewBox="-100 -100 200 200" aria-hidden="true" focusable="false">
      <g fill="none" stroke="currentColor" strokeWidth={stroke} vectorEffect="non-scaling-stroke">
        {paths.map((d, i) => (
          <path key={i} d={d} pathLength={1} opacity={0.35 + (i / paths.length) * 0.65} />
        ))}
      </g>
    </svg>
  );
});

/** A woven band of phase-shifted sine waves, as on a note's border or a security strip. */
export function wavePaths(width: number, height: number, lines = 6, waves = 6, seed = 'band') {
  const r = rand(hash(seed));
  const paths: string[] = [];
  const amp = height / 2 - 1;
  for (let l = 0; l < lines; l++) {
    const phase = (l / lines) * Math.PI * 2 + r() * 0.2;
    let d = '';
    const steps = Math.max(40, Math.round(width / 3));
    for (let i = 0; i <= steps; i++) {
      const x = (i / steps) * width;
      const y = height / 2 + amp * Math.sin((x / width) * waves * Math.PI * 2 + phase) * (0.55 + 0.45 * Math.cos(phase));
      d += `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`;
    }
    paths.push(d);
  }
  return paths;
}

export const WaveBand = memo(function WaveBand({ width, height, lines = 6, waves = 6, seed, className }: { width: number; height: number; lines?: number; waves?: number; seed?: string; className?: string }) {
  const paths = useMemo(() => wavePaths(width, height, lines, waves, seed), [width, height, lines, waves, seed]);
  return (
    <svg className={className} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <g fill="none" stroke="currentColor" strokeWidth="1" vectorEffect="non-scaling-stroke">
        {paths.map((d, i) => (
          <path key={i} d={d} pathLength={1} />
        ))}
      </g>
    </svg>
  );
});

/** Repeating microtext, the tiny engraved line that frames a banknote. */
export function Microtext({ text, className }: { text: string; className?: string }) {
  return (
    <span className={`microtext ${className ?? ''}`} aria-hidden="true">
      {Array.from({ length: 14 }, () => text).join(' · ')}
    </span>
  );
}
