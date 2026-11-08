import { after, before, describe, test } from 'node:test';
import assert from 'node:assert/strict';

process.env.DEPOSIT_DELAY_MS = '0';
process.env.PAYOUT_DELAY_MS = '0';

const { createApp } = await import('../src/app.js');
const { createDb } = await import('../src/db.js');
const { tronAddress } = await import('../src/providers/tether.js');

let server;
let base;

before(async () => {
  const { app } = createApp({ db: createDb(':memory:') });
  await new Promise((resolve) => {
    server = app.listen(0, resolve);
  });
  base = `http://127.0.0.1:${server.address().port}/api`;
});

after(() => server.close());

async function call(method, path, { token, body } = {}) {
  const res = await fetch(base + path, {
    method,
    headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  return { status: res.status, body: text ? JSON.parse(text) : null };
}

async function signup(email = `ada${Math.random().toString(36).slice(2)}@example.com`) {
  const res = await call('POST', '/auth/signup', { body: { name: 'Ada Lovelace', email, password: 'correct-horse' } });
  assert.equal(res.status, 201, JSON.stringify(res.body));
  return res.body;
}

describe('auth', () => {
  test('signup issues a Cleva USD account and two USDT addresses', async () => {
    const { token, user } = await signup();
    assert.ok(token);
    assert.equal(user.usdAccount.provider, 'cleva');
    assert.match(user.usdAccount.accountNumber, /^\d{10}$/);
    assert.match(user.wallets.TRC20.address, /^T[1-9A-HJ-NP-Za-km-z]{33}$/);
    assert.match(user.wallets.ERC20.address, /^0x[0-9a-f]{40}$/);
    assert.equal(user.password, undefined);
  });

  test('rejects duplicate email, weak password and bad login', async () => {
    const email = 'dup@example.com';
    await signup(email);
    assert.equal((await call('POST', '/auth/signup', { body: { name: 'X Y', email, password: 'correct-horse' } })).status, 409);
    assert.equal((await call('POST', '/auth/signup', { body: { name: 'X Y', email: 'n@e.com', password: 'short' } })).status, 400);
    assert.equal((await call('POST', '/auth/login', { body: { email, password: 'wrong-pass' } })).status, 401);
    assert.equal((await call('POST', '/auth/login', { body: { email, password: 'correct-horse' } })).status, 200);
  });

  test('protected routes require a token', async () => {
    assert.equal((await call('GET', '/portfolio')).status, 401);
    assert.equal((await call('GET', '/portfolio', { token: 'nope' })).status, 401);
  });

  test('demo login opens a lived-in account', async () => {
    const { body } = await call('POST', '/auth/demo');
    const p = (await call('GET', '/portfolio', { token: body.token })).body.portfolio;
    assert.equal(p.cash, 28);
    assert.ok(p.holdings.length >= 3);
    assert.equal(p.route.usdtIn, 60);
  });
});

describe('tron address', () => {
  test('is base58check with the 0x41 prefix', () => {
    for (let i = 0; i < 20; i++) assert.match(tronAddress(), /^T[1-9A-HJ-NP-Za-km-z]{33}$/);
  });
});

describe('money flow: USDT in → stocks → NGN out', () => {
  let token;
  before(async () => {
    ({ token } = await signup());
  });

  test('USDT deposit credits USD 1:1', async () => {
    const below = await call('POST', '/deposits/simulate', { token, body: { network: 'ERC20', amount: 5 } });
    assert.equal(below.status, 400);
    assert.equal(below.body.error.code, 'below_minimum');

    const res = await call('POST', '/deposits/simulate', { token, body: { network: 'TRC20', amount: 50 } });
    assert.equal(res.status, 201);
    const wallet = (await call('GET', '/wallet', { token })).body;
    assert.equal(wallet.balance.usd, 50);
    assert.equal(wallet.deposits[0].status, 'credited');
  });

  test('buys a $1 fractional share and rejects under $1 or over balance', async () => {
    assert.equal((await call('POST', '/orders', { token, body: { symbol: 'TSLA', side: 'buy', amount: 0.5 } })).status, 400);
    const tooMuch = await call('POST', '/orders', { token, body: { symbol: 'TSLA', side: 'buy', amount: 500 } });
    assert.equal(tooMuch.body.error.code, 'insufficient_funds');

    const res = await call('POST', '/orders', { token, body: { symbol: 'TSLA', side: 'buy', amount: 5 } });
    assert.equal(res.status, 201);
    assert.equal(res.body.order.status, 'filled');
    assert.ok(res.body.order.shares > 0 && res.body.order.shares < 1);

    await call('POST', '/orders', { token, body: { symbol: 'aapl', side: 'buy', amount: 1 } });
    const p = (await call('GET', '/portfolio', { token })).body.portfolio;
    assert.equal(p.cash, 44);
    assert.deepEqual(p.holdings.map((h) => h.symbol).sort(), ['AAPL', 'TSLA']);
    const pctSum = p.allocation.reduce((n, a) => n + a.pct, 0);
    assert.ok(Math.abs(pctSum - 1) < 0.01, `allocation sums to ${pctSum}`);
  });

  test('sells all of a position', async () => {
    const res = await call('POST', '/orders', { token, body: { symbol: 'AAPL', side: 'sell', all: true } });
    assert.equal(res.status, 201);
    const p = (await call('GET', '/portfolio', { token })).body.portfolio;
    assert.deepEqual(p.holdings.map((h) => h.symbol), ['TSLA']);
    const again = await call('POST', '/orders', { token, body: { symbol: 'AAPL', side: 'sell', amount: 1 } });
    assert.equal(again.body.error.code, 'no_position');
  });

  test('withdraws USD to a Nigerian bank in naira', async () => {
    const resolve = await call('POST', '/banks/resolve', { token, body: { bankCode: '058', accountNumber: '0123456789' } });
    assert.equal(resolve.body.accountName, 'ADA LOVELACE');
    assert.equal((await call('POST', '/banks/resolve', { token, body: { bankCode: '058', accountNumber: '123' } })).status, 400);

    const quote = (await call('GET', '/withdrawals/quote?amount=20', { token })).body;
    assert.equal(quote.fee, 0.5);
    assert.ok(quote.receiveNgn > 19.5 * 1000);

    const before = (await call('GET', '/wallet', { token })).body.balance.usd;
    const res = await call('POST', '/withdrawals', { token, body: { amount: 20, bankCode: '058', accountNumber: '0123456789' } });
    assert.equal(res.status, 201);
    assert.match(res.body.withdrawal.reference, /^CLV-/);
    const afterBal = (await call('GET', '/wallet', { token })).body.balance.usd;
    assert.equal(Math.round((before - afterBal) * 100), 2000);

    const tooMuch = await call('POST', '/withdrawals', { token, body: { amount: 10_000, bankCode: '058', accountNumber: '0123456789' } });
    assert.equal(tooMuch.body.error.code, 'insufficient_funds');
  });

  test('activity lists every step newest first', async () => {
    const { activity } = (await call('GET', '/activity', { token })).body;
    const types = activity.map((a) => a.type);
    assert.deepEqual(new Set(types), new Set(['deposit', 'buy', 'sell', 'withdrawal']));
    assert.equal(activity[0].type, 'withdrawal');
  });
});

describe('market intelligence', () => {
  test('insider feed is plain English and labelled as sample data', async () => {
    const { body } = await call('GET', '/market/feed');
    assert.equal(body.source, 'sample');
    assert.ok(body.insiders.length > 3);
    assert.match(body.insiders[0].headline, /(bought|sold) \$/);
  });

  test('collections and stock snapshot', async () => {
    const { collections } = (await call('GET', '/market/collections')).body;
    assert.ok(collections.find((c) => c.name === 'AI Revolution'));
    const { stock } = (await call('GET', '/market/stocks/nvda?range=1Y')).body;
    assert.equal(stock.symbol, 'NVDA');
    assert.ok(stock.history.length > 100);
    assert.ok(stock.explain.risk.score >= 1 && stock.explain.risk.score <= 10);
    assert.equal((await call('GET', '/market/stocks/NOPE')).status, 404);
  });

  test('search', async () => {
    const { results } = (await call('GET', '/market/search?q=clean')).body;
    assert.ok(results.every((r) => r.sector === 'Clean Energy'));
  });
});

describe('learn to earn', () => {
  test('passing a quiz grants $1 of stock exactly once', async () => {
    const { token } = await signup();
    const { course } = (await call('GET', '/learn/courses/networks', { token })).body;
    assert.equal(course.quiz[0].answer, undefined, 'answers never leave the server');

    const fail = (await call('POST', '/learn/courses/networks/submit', { token, body: { answers: [0, 0, 0] } })).body;
    assert.equal(fail.passed, false);

    const check = (await call('POST', '/learn/courses/networks/check', { token, body: { question: 1, choice: 1 } })).body;
    assert.equal(check.correct, true);

    const pass = (await call('POST', '/learn/courses/networks/submit', { token, body: { answers: [0, 1, 1] } })).body;
    assert.equal(pass.passed, true);
    assert.equal(pass.reward.symbol, 'NVDA');

    const again = (await call('POST', '/learn/courses/networks/submit', { token, body: { answers: [0, 1, 1] } })).body;
    assert.equal(again.reward, null);
    assert.equal(again.alreadyRewarded, true);

    const p = (await call('GET', '/portfolio', { token })).body.portfolio;
    assert.equal(p.holdings[0].symbol, 'NVDA');
    assert.equal(p.cash, 0);
  });
});
