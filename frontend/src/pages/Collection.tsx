import { Link, useParams } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { useApi } from '../lib/useApi';
import type { Collection } from '../lib/types';
import { LoadError, Skeleton } from '../components/ui';
import { StockRow } from './Discover';

export function CollectionPage() {
  const { id } = useParams();
  const { data, error, reload } = useApi<{ collection: Collection }>(`/market/collections/${id}`, { poll: 30_000 });
  const c = data?.collection;
  return (
    <div className="page">
      <Link to="/discover" className="back-link">
        <ChevronLeft size={16} aria-hidden="true" /> Discover
      </Link>
      {error ? (
        <LoadError error={error} onRetry={reload} />
      ) : (
        <>
          <div className="page-head">
            <div>
              <h1>{c?.name ?? <Skeleton h={30} w={220} />}</h1>
              {c && <p>{c.blurb}</p>}
            </div>
          </div>
          <section className="panel" style={{ maxWidth: 720 }}>
            {c ? (
              <ul className="rows">
                {c.stocks.map((s) => (
                  <li key={s.symbol}>
                    <StockRow s={s} />
                  </li>
                ))}
              </ul>
            ) : (
              <div className="panel-pad stack">
                <Skeleton h={44} />
                <Skeleton h={44} />
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
