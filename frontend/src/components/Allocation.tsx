import { pct, usd } from '../lib/format';
import type { Portfolio } from '../lib/types';

// Validated categorical order (see DESIGN.md): four stock slots, then a neutral "Other", then
// the USD reserve in the yellow slot, which also echoes Dollo's brass.
const STOCK_SLOTS = ['var(--series-1)', 'var(--series-2)', 'var(--series-3)', 'var(--series-4)'];

export function Allocation({ allocation }: { allocation: Portfolio['allocation'] }) {
  const stocks = allocation.filter((a) => a.kind === 'stock' && a.value > 0);
  const cash = allocation.find((a) => a.kind === 'cash');
  const top = stocks.slice(0, 4);
  const rest = stocks.slice(4);
  // Colour follows the entity: slots go to the top holdings in alphabetical order.
  const slotOf = new Map([...top].sort((a, b) => a.key.localeCompare(b.key)).map((a, i) => [a.key, STOCK_SLOTS[i]]));

  const parts = [
    ...top.map((a) => ({ ...a, color: slotOf.get(a.key)! })),
    ...(rest.length
      ? [{ key: 'OTHER', label: `${rest.length} other stocks`, kind: 'stock' as const, value: rest.reduce((n, a) => n + a.value, 0), pct: rest.reduce((n, a) => n + a.pct, 0), color: 'var(--series-other)' }]
      : []),
    ...(cash && cash.value > 0 ? [{ ...cash, color: 'var(--series-cash)' }] : []),
  ];

  const total = parts.reduce((n, p) => n + p.value, 0);
  if (!total) return null;

  return (
    <div className="alloc">
      <div className="alloc-bar" role="img" aria-label={parts.map((p) => `${p.label} ${pct(p.pct, false)}`).join(', ')}>
        {parts.map((p) => (
          <span key={p.key} style={{ flexGrow: p.value, background: p.color }} title={`${p.label}: ${usd(p.value)} (${pct(p.pct, false)})`} />
        ))}
      </div>
      <ul className="alloc-legend">
        {parts.map((p) => (
          <li key={p.key}>
            <span className="swatch" style={{ background: p.color }} aria-hidden="true" />
            <span className="alloc-name">{p.label}</span>
            <span className="num muted">{pct(p.pct, false)}</span>
            <span className="num alloc-val">{usd(p.value)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
