import { Link } from 'react-router-dom';
import { CheckCircle2, ChevronRight } from 'lucide-react';
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
          <div>
            <span className="earn-num num">${earned}</span>
            <span className="muted"> of ${available} earned</span>
          </div>
          <div className="earn-track" role="progressbar" aria-valuemin={0} aria-valuemax={courses.length} aria-valuenow={done.length} aria-label="Lessons completed">
            {courses.map((c) => (
              <span key={c.id} data-on={c.completed || undefined} />
            ))}
          </div>
          <span className="muted num">
            {done.length}/{courses.length} lessons
          </span>
        </div>
      )}

      {error && <LoadError error={error} onRetry={reload} />}
      <section className="panel" aria-label="Lessons" style={{ maxWidth: 760 }}>
        {!data ? (
          <div className="panel-pad stack">
            <Skeleton h={56} />
            <Skeleton h={56} />
            <Skeleton h={56} />
          </div>
        ) : (
          <ul className="rows">
            {courses.map((c) => (
              <li key={c.id}>
                <Link to={`/learn/${c.id}`} className="row lesson-row">
                  <span className="lesson-topic" data-done={c.completed || undefined} aria-hidden="true">
                    {c.completed ? <CheckCircle2 /> : `${c.minutes}m`}
                  </span>
                  <div className="row-main">
                    <div className="row-title">{c.title}</div>
                    <div className="row-sub">
                      {c.topic} · {c.minutes} minute · {c.questions} questions
                    </div>
                  </div>
                  <div className="row-end lesson-end">
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
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
