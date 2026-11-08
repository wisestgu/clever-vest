import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { Coin } from '../components/Coin';
import { useApi } from '../lib/useApi';
import { shares } from '../lib/format';
import type { CourseSummary } from '../lib/types';
import { LoadError, Skeleton } from '../components/ui';

export function Learn() {
  const { data, error, reload } = useApi<{ courses: CourseSummary[] }>('/learn/courses');
  const courses = data?.courses ?? [];
  const done = courses.filter((c) => c.completed);
  const earned = done.reduce((n, c) => n + c.reward.usd, 0);
  const available = courses.reduce((n, c) => n + c.reward.usd, 0);

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Learn &amp; earn</h1>
          <p>One-minute lessons on stablecoins, networks and stock basics. Answer all three questions correctly and we add a $1 slice of a US stock to your portfolio.</p>
        </div>
      </div>

      {data && (
        <div className="earn-strip" aria-label="Rewards progress">
          <div className="purse" role="img" aria-label={`${done.length} of ${courses.length} reward coins earned`}>
            {courses.map((c) => (
              <Coin key={c.id} value={`$${c.reward.usd}`} seed={c.id} size={44} earned={c.completed} />
            ))}
          </div>
          <div className="earn-copy">
            <span className="earn-num num">${earned} earned</span>
            <span className="muted num">
              ${available - earned} still in the purse · {done.length}/{courses.length} lessons
            </span>
          </div>
        </div>
      )}

      {error && <LoadError error={error} onRetry={reload} />}
      <section aria-label="Lessons" style={{ maxWidth: 760 }}>
        {!data ? (
          <div className="panel-pad stack">
            <Skeleton h={56} />
            <Skeleton h={56} />
            <Skeleton h={56} />
          </div>
        ) : (
          <ul className="ledger">
            {courses.map((c) => (
              <li key={c.id}>
                <Link to={`/learn/${c.id}`} className="ledger-row lesson-row">
                  <Coin value={`$${c.reward.usd}`} seed={c.id} size={44} earned={c.completed} />
                  <span className="ledger-main">
                    <span className="ledger-title">{c.title}</span>
                    <span className="ledger-sub">
                      {c.topic} · {c.minutes} minute · {c.questions} questions
                    </span>
                  </span>
                  <span className="lesson-end">
                    {c.completed && c.earned ? (
                      <span className="badge badge-gain num">
                        Earned {shares(c.earned.shares)} {c.reward.symbol}
                      </span>
                    ) : (
                      <span className="badge badge-brass">
                        ${c.reward.usd} of {c.reward.name}
                      </span>
                    )}
                    <ChevronRight className="muted" size={18} aria-hidden="true" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
