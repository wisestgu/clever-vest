import { useEffect, useRef, useState, type ReactNode } from 'react';
import { haptic } from '../lib/motion';

/**
 * Hold-to-confirm for irreversible money movement. The fill is slow and deliberate while held
 * (linear, the user is deciding) and snaps back fast on release (the system is responding).
 * Works with pointer, Space and Enter; screen readers hear the instruction.
 */
export function HoldButton({ onConfirm, children, hint, ms = 1400, disabled, busy }: { onConfirm: () => void; children: ReactNode; hint: string; ms?: number; disabled?: boolean; busy?: boolean }) {
  const [holding, setHolding] = useState(false);
  const timer = useRef<number | null>(null);
  const hintId = useRef(`hold-${Math.random().toString(36).slice(2)}`).current;

  const stop = () => {
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = null;
    setHolding(false);
  };
  const start = () => {
    if (disabled || busy || timer.current) return;
    setHolding(true);
    haptic('tick');
    timer.current = window.setTimeout(() => {
      timer.current = null;
      setHolding(false);
      onConfirm();
    }, ms);
  };
  useEffect(() => stop, []);

  return (
    <>
      <button
        type="button"
        className="btn btn-primary btn-block hold"
        data-holding={holding || undefined}
        data-loading={busy || undefined}
        disabled={disabled || busy}
        aria-describedby={hintId}
        style={{ ['--hold-ms' as string]: `${ms}ms` }}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          start();
        }}
        onPointerUp={stop}
        onPointerCancel={stop}
        onKeyDown={(e) => {
          if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) {
            e.preventDefault();
            start();
          }
        }}
        onKeyUp={(e) => (e.key === ' ' || e.key === 'Enter') && stop()}
        onContextMenu={(e) => e.preventDefault()}
      >
        <span className="hold-label">{children}</span>
        <span className="hold-fill" aria-hidden="true">
          <span className="hold-label">{children}</span>
        </span>
      </button>
      <span id={hintId} className="hint center">
        {hint}
      </span>
    </>
  );
}
