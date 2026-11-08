import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from 'motion/react';
import { X } from 'lucide-react';
import { project, spring } from '../lib/motion';

/** Progressive resistance past a boundary (Apple's rubber-band curve). */
function rubberband(overshoot: number, dimension: number, c = 0.55) {
  return (overshoot * dimension * c) / (dimension + c * Math.abs(overshoot));
}

/**
 * Bottom sheet for a focused task on phones. It tracks the finger 1:1 from where it was grabbed,
 * rubber-bands upward, projects a flick's momentum to decide dismiss vs. return, and hands the
 * release velocity to the spring. Every motion starts from the live on-screen position, so the
 * sheet can be grabbed again mid-flight.
 */
export function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const reduce = useReducedMotion();
  const panel = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(600);
  const y = useMotionValue(typeof window === 'undefined' ? 800 : window.innerHeight);
  const opacity = useMotionValue(reduce ? 0 : 1);
  const scrim = useTransform(y, (v) => Math.max(0, Math.min(1, 1 - v / height)));
  const drag = useRef<{ startY: number; origin: number; history: { t: number; y: number }[] } | null>(null);
  const closing = useRef(false);

  useLayoutEffect(() => {
    const h = panel.current?.offsetHeight ?? 600;
    setHeight(h);
    if (reduce) {
      y.set(0);
      animate(opacity, 1, { duration: 0.2 });
    } else {
      y.set(h);
      animate(y, 0, spring.ui);
    }
  }, [reduce, y, opacity]);

  const dismiss = useCallback(
    (velocity = 0) => {
      if (closing.current) return;
      closing.current = true;
      const done = () => onClose();
      if (reduce) animate(opacity, 0, { duration: 0.18 }).then(done);
      else animate(y, height, { ...(velocity ? spring.sheet : spring.ui), velocity }).then(done);
    },
    [height, onClose, opacity, reduce, y],
  );

  // Focus, Escape, scroll lock, focus restore.
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    panel.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && dismiss();
    document.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
      prev?.focus?.();
    };
  }, [dismiss]);

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0 || (e.target as HTMLElement).closest('button, a, input, select')) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    y.stop(); // grab it mid-flight: continue from the presentation value
    closing.current = false;
    drag.current = { startY: e.clientY, origin: y.get(), history: [{ t: e.timeStamp, y: e.clientY }] };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    let next = d.origin + (e.clientY - d.startY);
    if (next < 0) next = -rubberband(-next, height);
    y.set(next);
    d.history.push({ t: e.timeStamp, y: e.clientY });
    if (d.history.length > 6) d.history.shift();
  };

  const onPointerUp = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    drag.current = null;
    const recent = d.history.filter((h) => e.timeStamp - h.t < 100);
    const a = recent[0] ?? d.history[0];
    const b = d.history[d.history.length - 1];
    const velocity = b.t > a.t ? ((b.y - a.y) / (b.t - a.t)) * 1000 : 0; // px/s
    const projected = y.get() + project(velocity);
    if (projected > height * 0.5) dismiss(velocity);
    else animate(y, 0, { ...spring.sheet, velocity });
  };

  return createPortal(
    <div className="sheet-root">
      <motion.div className="sheet-scrim" style={{ opacity: reduce ? opacity : scrim }} onClick={() => dismiss()} aria-hidden="true" />
      <motion.div
        ref={panel}
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        style={{ y, opacity }}
      >
        <div className="sheet-grab" onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp}>
          <span className="sheet-handle" aria-hidden="true" />
          <div className="sheet-head">
            <h2>{title}</h2>
            <button type="button" className="icon-btn icon-btn-round" onClick={() => dismiss()} aria-label="Close">
              <X />
            </button>
          </div>
        </div>
        <div className="sheet-body">{children}</div>
      </motion.div>
    </div>,
    document.body,
  );
}
