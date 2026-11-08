import crypto from 'node:crypto';
import * as cleva from '../providers/cleva.js';
import { createWallets } from '../providers/tether.js';
import { badRequest, conflict, unauthorized } from '../lib/errors.js';
import { MICRO } from '../lib/money.js';
import { id } from '../lib/random.js';
import { priceAt } from '../lib/prices.js';

const SESSION_TTL_MS = 30 * 86_400_000;
export const DEMO = { email: 'demo@dollo.app', password: 'dollo-demo-2026', name: 'Adaeze Okafor' };

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.scryptSync(password, salt, 32).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  const [salt, hash] = stored.split(':');
  const candidate = crypto.scryptSync(password, salt, 32);
  return crypto.timingSafeEqual(candidate, Buffer.from(hash, 'hex'));
}

export function publicUser(u) {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    createdAt: u.createdAt,
    usdAccount: u.cleva,
    wallets: u.wallets,
    completedCourses: u.completedCourses,
  };
}

export function createUsers(db) {
  const s = () => db.state;

  function findByEmail(email) {
    return Object.values(s().users).find((u) => u.email === email.toLowerCase());
  }

  function createUser({ name, email, password }) {
    const cleanName = String(name ?? '').trim().replace(/\s+/g, ' ');
    const cleanEmail = String(email ?? '').trim().toLowerCase();
    if (cleanName.length < 2) throw badRequest('invalid_name', 'Enter your full name as it appears on your bank account.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) throw badRequest('invalid_email', 'Enter a valid email address.');
    if (String(password ?? '').length < 8) throw badRequest('weak_password', 'Use at least 8 characters for your password.');
    if (findByEmail(cleanEmail)) throw conflict('email_taken', 'An account with this email already exists. Sign in instead.');
    const user = {
      id: id('usr'),
      name: cleanName,
      email: cleanEmail,
      password: hashPassword(password),
      createdAt: new Date().toISOString(),
      balances: { usdCents: 0 },
      holdings: {},
      completedCourses: {},
    };
    user.cleva = cleva.createUsdAccount(user);
    user.wallets = createWallets();
    s().users[user.id] = user;
    db.save();
    return user;
  }

  function createSession(user) {
    const token = crypto.randomBytes(32).toString('base64url');
    s().sessions[token] = { userId: user.id, expiresAt: Date.now() + SESSION_TTL_MS };
    db.save();
    return token;
  }

  function login({ email, password }) {
    const user = findByEmail(String(email ?? ''));
    if (!user || !verifyPassword(String(password ?? ''), user.password)) {
      throw unauthorized('That email and password don’t match. Check them and try again.');
    }
    return user;
  }

  function fromToken(token) {
    const sess = token && s().sessions[token];
    if (!sess) return null;
    if (sess.expiresAt < Date.now()) {
      delete s().sessions[token];
      db.save();
      return null;
    }
    return s().users[sess.userId] ?? null;
  }

  function logout(token) {
    delete s().sessions[token];
    db.save();
  }

  /** Seed a demo investor with a realistic history so the hackathon demo opens on a lived-in account. */
  function ensureDemo() {
    if (findByEmail(DEMO.email)) return;
    const u = createUser(DEMO);
    const day = 86_400_000;
    const now = Date.now();
    const at = (daysAgo) => new Date(now - daysAgo * day).toISOString();
    const st = s();

    st.deposits.push({
      id: id('dep'), userId: u.id, network: 'TRC20', asset: 'USDT', amountCents: 6000, address: u.wallets.TRC20.address,
      txHash: 'sandbox-seed', status: 'credited', createdAt: at(12), creditAt: at(12), creditedAt: at(12), simulated: true,
    });
    st.activity.push({ id: id('act'), userId: u.id, type: 'deposit', refId: 'seed-dep', status: 'completed', title: 'USDT deposit (TRC20)', amountCents: 6000, direction: 'in', createdAt: at(12) });

    const buys = [
      { symbol: 'AAPL', cents: 1000, daysAgo: 11 },
      { symbol: 'TSLA', cents: 500, daysAgo: 9 },
      { symbol: 'NVDA', cents: 700, daysAgo: 6 },
    ];
    let cash = 6000;
    for (const b of buys) {
      const price = priceAt(b.symbol, now - b.daysAgo * day);
      const micro = Math.floor((b.cents / 100 / price) * MICRO);
      const h = u.holdings[b.symbol] ?? { micro: 0, costCents: 0 };
      h.micro += micro;
      h.costCents += b.cents;
      u.holdings[b.symbol] = h;
      cash -= b.cents;
      const orderId = id('ord');
      st.orders.push({ id: orderId, userId: u.id, symbol: b.symbol, side: 'buy', notionalCents: b.cents, price, micro, shares: micro / MICRO, status: 'filled', broker: 'sandbox', createdAt: at(b.daysAgo) });
      st.activity.push({ id: id('act'), userId: u.id, type: 'buy', refId: orderId, status: 'completed', title: `Bought ${b.symbol === 'AAPL' ? 'Apple' : b.symbol === 'TSLA' ? 'Tesla' : 'NVIDIA'}`, symbol: b.symbol, shares: micro / MICRO, amountCents: -b.cents, direction: 'out', createdAt: at(b.daysAgo) });
    }

    // Completed the first micro-course and earned $1 of Apple.
    const rPrice = priceAt('AAPL', now - 10 * day);
    const rMicro = Math.floor((1 / rPrice) * MICRO);
    u.holdings.AAPL.micro += rMicro;
    u.holdings.AAPL.costCents += 100;
    u.completedCourses.stablecoins = { courseId: 'stablecoins', symbol: 'AAPL', usd: 1, shares: rMicro / MICRO, price: rPrice, at: at(10) };
    st.activity.push({ id: id('act'), userId: u.id, type: 'reward', refId: `${u.id}:stablecoins`, status: 'completed', title: 'Reward: $1 of Apple', symbol: 'AAPL', shares: rMicro / MICRO, amountCents: 0, valueCents: 100, direction: 'in', createdAt: at(10) });

    // One naira withdrawal to a GTBank account.
    const rate = 1518.4;
    const wdCents = 1000;
    const fee = 50;
    const kobo = Math.floor((wdCents - fee) * rate);
    st.withdrawals.push({ id: id('wd'), userId: u.id, amountCents: wdCents, feeCents: fee, rate, receiveKobo: kobo, bankCode: '058', bankName: 'Guaranty Trust Bank', accountNumber: '0123456789', accountName: DEMO.name.toUpperCase(), reference: 'CLV-SEED0001', status: 'completed', createdAt: at(4), settleAt: at(4), completedAt: at(4) });
    st.activity.push({ id: id('act'), userId: u.id, type: 'withdrawal', refId: 'seed-wd', status: 'completed', title: 'Withdrawal to Guaranty Trust Bank', amountCents: -wdCents, receiveKobo: kobo, direction: 'out', createdAt: at(4) });
    cash -= wdCents;

    u.balances.usdCents = cash;
    db.save();
  }

  return { createUser, createSession, login, fromToken, logout, ensureDemo };
}
