import { Router } from 'express';
import { badRequest, notFound } from '../lib/errors.js';
import { BY_SYMBOL } from '../seed/stocks.js';
import { BY_ID, COURSES } from '../seed/courses.js';

const publicCourse = (c, user, { full = false } = {}) => ({
  id: c.id,
  title: c.title,
  topic: c.topic,
  minutes: c.minutes,
  reward: { ...c.reward, name: BY_SYMBOL[c.reward.symbol].name },
  completed: Boolean(user?.completedCourses?.[c.id]),
  earned: user?.completedCourses?.[c.id] ?? null,
  ...(full ? { cards: c.cards, quiz: c.quiz.map(({ q, options }) => ({ q, options })) } : { questions: c.quiz.length }),
});

export default function learnRoutes({ ledger, requireUser }) {
  const r = Router();

  r.get('/courses', requireUser, (req, res) => {
    res.json({ courses: COURSES.map((c) => publicCourse(c, req.user)) });
  });

  r.get('/courses/:id', requireUser, (req, res) => {
    const c = BY_ID[req.params.id];
    if (!c) throw notFound('That lesson doesn’t exist.');
    res.json({ course: publicCourse(c, req.user, { full: true }) });
  });

  /** Check a single answer for instant feedback, without revealing the others. */
  r.post('/courses/:id/check', requireUser, (req, res) => {
    const c = BY_ID[req.params.id];
    if (!c) throw notFound('That lesson doesn’t exist.');
    const i = Number(req.body?.question);
    const choice = Number(req.body?.choice);
    const q = c.quiz[i];
    if (!q || !Number.isInteger(choice) || choice < 0 || choice >= q.options.length) throw badRequest('invalid_answer', 'Pick one of the options.');
    res.json({ correct: q.answer === choice, correctIndex: q.answer });
  });

  r.post('/courses/:id/submit', requireUser, async (req, res) => {
    const c = BY_ID[req.params.id];
    if (!c) throw notFound('That lesson doesn’t exist.');
    const answers = req.body?.answers;
    if (!Array.isArray(answers) || answers.length !== c.quiz.length) throw badRequest('invalid_answers', `Answer all ${c.quiz.length} questions.`);
    const score = c.quiz.reduce((n, q, i) => n + (Number(answers[i]) === q.answer ? 1 : 0), 0);
    const passed = score === c.quiz.length;
    let reward = null;
    if (passed && !req.user.completedCourses[c.id]) reward = await ledger.grantReward(req.user, c.id);
    res.json({ score, total: c.quiz.length, passed, reward, alreadyRewarded: passed && !reward });
  });

  return r;
}
