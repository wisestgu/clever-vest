import { useEffect, useId, useRef, type ReactNode } from 'react';
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from 'motion/react';
import { spring } from '../lib/motion';

/**
 * A number that rolls to its new value with a critically damped spring, starting from whatever is
 * on screen right now (so a second change mid-roll continues smoothly instead of jumping).
 */
export function AnimatedNumber({ value, format, className }: { value: number; format: (n: number) => string; className?: string }) {
  const reduce = useReducedMotion();
  const mv = useMotionValue(value);
  const text = useTransform(mv, (v) => format(v));
  const first = useRef(true);

  useEffect(() => {
    if (first.current || reduce) {
      first.current = false;
      mv.set(value);
      return;
    }
    const controls = animate(mv, value, { type: 'spring', bounce: 0, duration: 0.7 });
    return () => controls.stop();
  }, [value, reduce, mv]);

  return (
    <motion.span className={className} aria-label={format(value)}>
      {text}
    </motion.span>
  );
}

interface SegOption<T extends string> {
  value: T;
  label: ReactNode;
  disabled?: boolean;
}

/**
 * iOS-style segmented control: the selected thumb slides between options on a spring, and the
 * whole control is a proper radio group (or tablist) for assistive tech and keyboards.
 */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
  block,
  role = 'radiogroup',
}: {
  options: SegOption<T>[];
  value: T;
  onChange: (v: T) => void;
  label: string;
  block?: boolean;
  role?: 'radiogroup' | 'tablist';
}) {
  const id = useId();
  const itemRole = role === 'tablist' ? 'tab' : 'radio';
  return (
    <div className={`segmented ${block ? 'segmented-block' : ''}`} role={role} aria-label={label}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role={itemRole}
            aria-checked={itemRole === 'radio' ? on : undefined}
            aria-selected={itemRole === 'tab' ? on : undefined}
            tabIndex={on ? 0 : -1}
            disabled={o.disabled}
            onClick={() => onChange(o.value)}
            onKeyDown={(e) => {
              if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
              e.preventDefault();
              const enabled = options.filter((x) => !x.disabled);
              const i = enabled.findIndex((x) => x.value === value);
              const next = enabled[(i + (e.key === 'ArrowRight' ? 1 : -1) + enabled.length) % enabled.length];
              onChange(next.value);
              (e.currentTarget.parentElement?.querySelector(`[data-v="${next.value}"]`) as HTMLElement | null)?.focus();
            }}
            data-v={o.value}
            data-on={on || undefined}
          >
            {on && <motion.span className="segmented-thumb" layoutId={`seg-${id}`} transition={spring.snappy} aria-hidden="true" />}
            <span className="segmented-label">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}
