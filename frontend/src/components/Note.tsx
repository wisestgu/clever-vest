import { useRef, type ReactNode } from 'react';
import { motion, useMotionTemplate, useMotionValue, useReducedMotion, useSpring, useTransform } from 'motion/react';
import { Microtext, Rosette, WaveBand } from './Guilloche';

export type Tint = 'green' | 'violet' | 'copper' | 'blue';

/**
 * A value printed as a banknote: intaglio ground, generated guilloche, microtext border, serial
 * number and a holographic security thread. On hover/drag the note tilts toward the pointer on a
 * critically damped spring and the thread's foil shifts with the angle, like the real thing.
 */
export function Note({
  seed,
  tint = 'green',
  size = 'hero',
  micro,
  serial,
  corner,
  children,
  className = '',
  as = 'div',
}: {
  seed: string;
  tint?: Tint;
  size?: 'hero' | 'mini';
  micro: string;
  serial?: string;
  corner?: string;
  children: ReactNode;
  className?: string;
  as?: 'div' | 'article';
}) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const cfg = { stiffness: 220, damping: 30, mass: 0.6 }; // ≈ critically damped, response ~0.3s
  const rx = useSpring(useTransform(py, [0, 1], size === 'hero' ? [7, -7] : [5, -5]), cfg);
  const ry = useSpring(useTransform(px, [0, 1], size === 'hero' ? [-9, 9] : [-6, 6]), cfg);
  const foil = useSpring(useTransform(px, [0, 1], [0, 220]), cfg);
  const sheenX = useSpring(useTransform(px, [0, 1], [10, 90]), cfg);
  const sheenY = useSpring(useTransform(py, [0, 1], [0, 100]), cfg);
  const sheen = useMotionTemplate`radial-gradient(60% 80% at ${sheenX}% ${sheenY}%, rgba(255,255,255,0.13), transparent 70%)`;
  const foilPos = useMotionTemplate`50% ${foil}%`;

  const track = (e: React.PointerEvent) => {
    if (reduce || e.pointerType === 'touch') return;
    const r = ref.current!.getBoundingClientRect();
    px.set((e.clientX - r.left) / r.width);
    py.set((e.clientY - r.top) / r.height);
  };
  const rest = () => {
    px.set(0.5);
    py.set(0.5);
  };

  const Tag = as === 'article' ? motion.article : motion.div;

  return (
    <div className={`note-stage note-${size} ${className}`} onPointerMove={track} onPointerLeave={rest}>
      <Tag ref={ref} className={`note tint-${tint}`} style={reduce ? undefined : { rotateX: rx, rotateY: ry }}>
        <div className="note-ground" aria-hidden="true" />
        <Rosette seed={seed} className="note-rosette" layers={size === 'hero' ? 6 : 5} />
        <WaveBand width={600} height={34} lines={size === 'hero' ? 7 : 5} waves={size === 'hero' ? 11 : 7} seed={seed} className="note-band" />
        <div className="note-frame" aria-hidden="true">
          <Microtext text={micro} className="micro-top" />
          <Microtext text={micro} className="micro-bottom" />
        </div>
        {size === 'hero' && <motion.div className="note-thread" style={reduce ? undefined : { backgroundPosition: foilPos }} aria-hidden="true" />}
        {corner && (
          <span className="note-corner" aria-hidden="true">
            {corner}
          </span>
        )}
        <div className="note-content">{children}</div>
        {serial && (
          <span className="note-serial" aria-label={`Account ${serial}`}>
            {serial}
          </span>
        )}
        {!reduce && <motion.div className="note-sheen" style={{ background: sheen }} aria-hidden="true" />}
      </Tag>
    </div>
  );
}
