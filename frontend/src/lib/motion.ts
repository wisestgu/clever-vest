import type { Transition } from 'motion/react';

// Springs in Apple's terms (damping ratio + response), mapped to Motion's bounce + duration.
// Default UI motion is critically damped (no overshoot); bounce is reserved for motion that
// follows a gesture which itself carried momentum (a flick, a drag release).
export const spring = {
  /** Default: move / reposition. damping 1.0, response 0.4 */
  ui: { type: 'spring', bounce: 0, duration: 0.4 } satisfies Transition,
  /** Quick state changes: segmented thumbs, small reflows. damping 1.0, response 0.3 */
  snappy: { type: 'spring', bounce: 0, duration: 0.3 } satisfies Transition,
  /** Sheets and drawers released by a gesture. damping 0.8, response 0.3 */
  sheet: { type: 'spring', bounce: 0.2, duration: 0.3 } satisfies Transition,
  /** Cards thrown by a swipe. damping ~0.8, response 0.35 */
  flick: { type: 'spring', bounce: 0.18, duration: 0.35 } satisfies Transition,
};

/**
 * Apple's momentum projection (Designing Fluid Interfaces): where a flick would come to rest
 * under scroll-like deceleration. Use it to choose a snap target, then hand the velocity to a spring.
 */
export function project(velocity: number, decelerationRate = 0.998) {
  return ((velocity / 1000) * decelerationRate) / (1 - decelerationRate);
}

/** Haptics only for meaningful moments (commit, success, error), fired with the visual change. */
export function haptic(kind: 'success' | 'error' | 'tick' = 'tick') {
  try {
    const pattern = kind === 'success' ? [12, 60, 18] : kind === 'error' ? [30, 50, 30] : 8;
    navigator.vibrate?.(pattern);
  } catch {
    /* unsupported */
  }
}
