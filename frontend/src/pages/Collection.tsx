import { Link, useParams } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { useApi } from '../lib/useApi';
import type { Collection } from '../lib/types';
import { LoadError, Skeleton } from '../components/ui';
import { Note, type Tint } from '../components/Note';
import { StockRow } from './Discover';

const TINT: Record<string, Tint> = { 'ai-revolution': 'violet', 'dividend-payers': 'copper', 'clean-energy': 'green', 'everyday-brands': 'blue' };

export function CollectionPage() {
  const { id = '' } = useParams();
  const { data, error, reload } = useApi<{ collection: Collection }>(`/market/collections/${id}`, { poll: 30_000 });
  const c = data?.collection;
  return (
    <div className="page">
      <Link to="/discover" className="back-link">
        <ChevronLeft size={16} aria-hidden="true" /> Markets
      </Link>
      {error ? (
        <LoadError error={error} onRetry={reload} />
      ) : !c ? (
        <Skeleton h={200} r={14} />
      ) : (
        <div className="split">
          <section>
            <ul className="ledger">
              {c.stocks.map((s) => (
                <li key={s.symbol}>
                  <StockRow s={s} />
                </li>
              ))}
            </ul>
          </section>
          <div className="sticky-col collection-note">
            <Note seed={c.id} tint={TINT[c.id] ?? 'green'} size="mini" micro={c.name.toUpperCase()} corner={String(c.stocks.length)}>
              <span className="note-label">Collection · {c.stocks.length} companies</span>
              <h1 className="mini-title mini-title-lg">{c.name}</h1>
              <p className="mini-sub">{c.blurb}</p>
            </Note>
          </div>
        </div>
      )}
    </div>
  );
}
