import { Router } from 'express';
import { publicUser, DEMO } from '../services/users.js';

export default function authRoutes({ users, requireUser }) {
  const r = Router();

  r.post('/signup', (req, res) => {
    const user = users.createUser(req.body ?? {});
    res.status(201).json({ token: users.createSession(user), user: publicUser(user) });
  });

  r.post('/login', (req, res) => {
    const user = users.login(req.body ?? {});
    res.json({ token: users.createSession(user), user: publicUser(user) });
  });

  r.post('/demo', (_req, res) => {
    users.ensureDemo();
    const user = users.login(DEMO);
    res.json({ token: users.createSession(user), user: publicUser(user) });
  });

  r.post('/logout', requireUser, (req, res) => {
    users.logout(req.token);
    res.status(204).end();
  });

  r.get('/me', requireUser, (req, res) => res.json({ user: publicUser(req.user) }));

  return r;
}
