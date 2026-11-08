import { useState, type ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion, type PanInfo } from 'motion/react';
import { ArrowRight, Check, ChevronLeft, PartyPopper, RotateCcw, X } from 'lucide-react';
import { api } from '../lib/api';
import { invalidate, useApi } from '../lib/useApi';
import { useAuth } from '../lib/auth';
import { shares, usd } from '../lib/format';
import { haptic, project, spring } from '../lib/motion';
import type { Course, Reward } from '../lib/types';
import { Button, LoadError, Notice, Skeleton } from '../components/ui';

type Result = { score: number; total: number; passed: boolean; reward: Reward | null; alreadyRewarded: boolean };

/** Cards enter from the side they're coming from and leave the way they came (spatial consistency). */
const slide = {
  enter: ({ dir, reduce }: Dir) => (reduce ? { opacity: 0 } : { x: dir * 56, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: ({ dir, reduce }: Dir) => ({ opacity: 0, pointerEvents: 'none' as const, ...(reduce ? {} : { x: dir * -56 }) }),
};
type Dir = { dir: number; reduce: boolean };

function Stage({ k, dir, flick, children, onSwipe }: { k: string; dir: number; flick: boolean; children: ReactNode; onSwipe?: (d: 1 | -1) => void }) {
  const reduce = Boolean(useReducedMotion());
  const onDragEnd = (_: unknown, info: PanInfo) => {
    // Choose the outcome from where the flick is heading, not where the finger let go.
    const projected = info.offset.x + project(info.velocity.x);
    if (projected < -140) onSwipe?.(1);
    else if (projected > 140) onSwipe?.(-1);
  };
  return (
    <div className="lesson-stage">
      <AnimatePresence mode="popLayout" initial={false} custom={{ dir, reduce }}>
        <motion.section
          key={k}
          className="panel panel-pad stack-l lesson-card"
          custom={{ dir, reduce }}
          variants={slide}
          initial="enter"
          animate="center"
          exit="exit"
          transition={reduce ? { duration: 0.2 } : flick ? spring.flick : spring.ui}
          drag={onSwipe && !reduce ? 'x' : false}
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.32}
          dragDirectionLock
          onDragEnd={onDragEnd}
          aria-live="polite"
        >
          {children}
        </motion.section>
      </AnimatePresence>
    </div>
  );
}

export function Lesson() {
  const { id } = useParams();
  const { refresh } = useAuth();
  const { data, error, reload } = useApi<{ course: Course }>(`/learn/courses/${id}`);
  const course = data?.course;
  const [step, setStep] = useState(0);
  const [nav, setNav] = useState({ dir: 1, flick: false });
  const [answers, setAnswers] = useState<number[]>([]);
  const [feedback, setFeedback] = useState<{ correct: boolean; correctIndex: number } | null>(null);
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [err, setErr] = useState<string | null>(null);

  if (error)
    return (
      <div className="page">
        <LoadError error={error} onRetry={reload} />
      </div>
    );
  if (!course)
    return (
      <div className="page lesson-page">
        <Skeleton h={8} />
        <Skeleton h={260} />
      </div>
    );

  const cards = course.cards.length;
  const total = cards + course.quiz.length;
  const inQuiz = step >= cards && !result;
  const qi = step - cards;
  const question = inQuiz ? course.quiz[qi] : null;

  const go = (next: number, flick = false) => {
    setNav({ dir: next >= step ? 1 : -1, flick });
    setStep(next);
  };

  const choose = async (choice: number) => {
    if (feedback || checking) return;
    setChecking(true);
    setErr(null);
    try {
      const r = await api<{ correct: boolean; correctIndex: number }>(`/learn/courses/${course.id}/check`, { body: { question: qi, choice } });
      setAnswers((a) => {
        const next = [...a];
        next[qi] = choice;
        return next;
      });
      setFeedback(r);
      haptic(r.correct ? 'tick' : 'error');
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setChecking(false);
    }
  };

  const next = async () => {
    setFeedback(null);
    if (step + 1 < total) return go(step + 1);
    setChecking(true);
    try {
      const r = await api<Result>(`/learn/courses/${course.id}/submit`, { body: { answers } });
      setNav({ dir: 1, flick: false });
      setResult(r);
      if (r.passed) haptic('success');
      if (r.reward) {
        invalidate();
        refresh();
      }
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setChecking(false);
    }
  };

  const restart = (toStart: boolean) => {
    setNav({ dir: -1, flick: false });
    setStep(toStart ? 0 : cards);
    setAnswers([]);
    setResult(null);
    setFeedback(null);
  };

  const stageKey = result ? 'result' : `step-${step}`;

  return (
    <div className="page lesson-page">
      <Link to="/learn" className="back-link">
        <ChevronLeft size={16} aria-hidden="true" /> All lessons
      </Link>
      <div className="lesson-progress" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={result ? total : step + 1} aria-label="Lesson progress">
        {Array.from({ length: total }, (_, i) => (
          <span key={i} data-on={i <= step || Boolean(result) || undefined} data-quiz={i >= cards || undefined} />
        ))}
      </div>

      <div className="lesson-meta">
        <span className="muted">{course.title}</span>
        <span className="badge badge-brass">{course.completed && !result?.reward ? 'Reward earned' : `$${course.reward.usd} of ${course.reward.name}`}</span>
      </div>

      <Stage
        k={stageKey}
        dir={nav.dir}
        flick={nav.flick}
        onSwipe={
          !result && !question
            ? (d) => {
                if (d === 1) go(step + 1, true);
                else if (step > 0) go(step - 1, true);
              }
            : undefined
        }
      >
        {result ? (
          result.passed ? (
            <>
              <div className="result-icon brass">
                <PartyPopper />
              </div>
              <div className="stack-s">
                <h1>{result.reward ? `You earned ${usd(result.reward.usd)} of ${course.reward.name}` : 'Perfect score'}</h1>
                <p className="muted">
                  {result.reward
                    ? `${shares(result.reward.shares)} shares of ${result.reward.symbol}, bought at ${usd(result.reward.price)}, are now in your portfolio.`
                    : 'You already collected the reward for this lesson, but a refresher never hurts.'}
                </p>
              </div>
              <div className="cluster">
                <Link to="/learn" className="btn btn-primary">
                  Next lesson <ArrowRight aria-hidden="true" />
                </Link>
                <Link to={`/stocks/${course.reward.symbol}`} className="btn">
                  View {course.reward.name}
                </Link>
              </div>
            </>
          ) : (
            <>
              <div className="stack-s">
                <h1>
                  {result.score} of {result.total} correct
                </h1>
                <p className="muted">Get all three right to earn the reward. The lesson cards are still here if you want another look.</p>
              </div>
              <div className="cluster">
                <Button variant="primary" onClick={() => restart(false)}>
                  <RotateCcw aria-hidden="true" /> Try the questions again
                </Button>
                <Button onClick={() => restart(true)}>Re-read the lesson</Button>
              </div>
            </>
          )
        ) : question ? (
          <>
            <div className="stack-s">
              <span className="hint num">
                Question {qi + 1} of {course.quiz.length}
              </span>
              <h1>{question.q}</h1>
            </div>
            <div className="options" role="group" aria-label="Answers">
              {question.options.map((o, i) => {
                const state = feedback ? (i === feedback.correctIndex ? 'right' : i === answers[qi] ? 'wrong' : 'idle') : 'idle';
                return (
                  <button key={o} type="button" className="option" data-state={state} aria-pressed={answers[qi] === i} disabled={Boolean(feedback) || checking} onClick={() => choose(i)}>
                    <span>{o}</span>
                    {state === 'right' && <Check aria-label="Correct answer" />}
                    {state === 'wrong' && <X aria-label="Your answer" />}
                  </button>
                );
              })}
            </div>
            {feedback && <Notice kind={feedback.correct ? 'success' : 'error'}>{feedback.correct ? 'Correct.' : 'Not quite. The highlighted answer is the right one.'}</Notice>}
            {err && <Notice kind="error">{err}</Notice>}
            <div>
              <Button variant="primary" onClick={next} disabled={!feedback} loading={checking && Boolean(feedback)}>
                {step + 1 < total ? 'Next question' : 'See my result'} <ArrowRight aria-hidden="true" />
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="stack-s">
              <span className="hint num">
                {step + 1} of {cards}
              </span>
              <h1>{course.cards[step].title}</h1>
              <p className="lesson-body">{course.cards[step].body}</p>
            </div>
            <div className="lesson-nav">
              <div className="cluster">
                {step > 0 && <Button onClick={() => go(step - 1)}>Back</Button>}
                <Button variant="primary" onClick={() => go(step + 1)}>
                  {step + 1 < cards ? 'Next' : 'Start the quiz'} <ArrowRight aria-hidden="true" />
                </Button>
              </div>
              <span className="hint swipe-hint">or swipe</span>
            </div>
          </>
        )}
      </Stage>
    </div>
  );
}
