import { Rosette } from './Guilloche';

/** A struck copper coin: Learn-to-earn rewards are paid in these. */
export function Coin({ value, seed, size = 56, earned }: { value: string; seed: string; size?: number; earned?: boolean }) {
  return (
    <span className="coin" data-earned={earned || undefined} style={{ width: size, height: size, ['--coin' as string]: `${size}px` }} aria-hidden="true">
      <Rosette seed={seed} layers={4} stroke={0.7} className="coin-rosette" />
      <span className="coin-value">{value}</span>
    </span>
  );
}
