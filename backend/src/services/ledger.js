import * as alpaca from '../providers/alpaca.js';
import * as cleva from '../providers/cleva.js';
import { NETWORKS, fakeTxHash } from '../providers/tether.js';
import { usdNgn, withdrawalFeeCents } from '../providers/fx.js';
import { BY_SYMBOL } from '../seed/stocks.js';
import { BY_ID as COURSES } from '../seed/courses.js';
import { badRequest, conflict, notFound } from '../lib/errors.js';
import { MICRO, fromCents, fromMicro } from '../lib/money.js';
import { id } from '../lib/random.js';
import { quote, quotes } from './market.js';

const depositDelay = () => Number(process.env.DEPOSIT_DELAY_MS ?? 8000);
const payoutDelay = () => Number(process.env.PAYOUT_DELAY_MS ?? 10000);

export function createLedger(db) {
  const s = () => db.state;

  function addActivity(userId, entry) {
    const item = { id: id('act'), userId, createdAt: new Date().toISOString(), status: 'completed', ...entry };
    s().activity.push(item);
    return item;
  }

  function updateActivity(refId, patch) {
    const a = s().activity.find((x) => x.refId === refId);
    if (a) Object.assign(a, patch);
  }

  /** Apply time-based state transitions for sandbox deposits and payouts. */
  function settle(user, now = Date.now()) {
    let changed = false;
    for (const d of s().deposits) {
      if (d.userId !== user.id || d.status !== 'confirming') continue;
      if (now >= Date.parse(d.creditAt)) {
        d.status = 'credited';
        d.creditedAt = new Date(now).toISOString();
        user.balances.usdCents += d.amountCents;
        updateActivity(d.id, { status: 'completed' });
        changed = true;
      }
    }
    for (const w of s().withdrawals) {
      if (w.userId !== user.id || w.status !== 'processing') continue;
      if (now >= Date.parse(w.settleAt)) {
        w.status = 'completed';
        w.completedAt = new Date(now).toISOString();
        updateActivity(w.id, { status: 'completed' });
        changed = true;
      }
    }
    if (changed) db.save();
  }

  function depositView(d, now = Date.now()) {
    const net = NETWORKS[d.network];
    const total = Date.parse(d.creditAt) - Date.parse(d.createdAt);
    const elapsed = now - Date.parse(d.createdAt);
    const confirmations = d.status === 'credited' ? net.confirmations : Math.min(net.confirmations - 1, Math.floor((elapsed / Math.max(total, 1)) * net.confirmations));
    return { ...d, amount: fromCents(d.amountCents), confirmations, requiredConfirmations: net.confirmations };
  }

  function simulateDeposit(user, { network, amountCents }) {
    const net = NETWORKS[network];
    if (!net) throw badRequest('invalid_network', 'Choose TRC20 (Tron) or ERC20 (Ethereum).');
    if (amountCents < net.minDepositUsd * 100) throw badRequest('below_minimum', `The minimum ${network} deposit is ${net.minDepositUsd} USDT.`);
    if (amountCents > 1_000_000) throw badRequest('above_maximum', 'Sandbox deposits are capped at 10,000 USDT.');
    const now = Date.now();
    const d = {
      id: id('dep'),
      userId: user.id,
      network,
      asset: 'USDT',
      amountCents,
      address: user.wallets[network].address,
      txHash: fakeTxHash(network),
      status: 'confirming',
      createdAt: new Date(now).toISOString(),
      creditAt: new Date(now + depositDelay()).toISOString(),
      simulated: true,
    };
    s().deposits.push(d);
    addActivity(user.id, { type: 'deposit', refId: d.id, status: 'pending', title: `USDT deposit (${network})`, amountCents, direction: 'in' });
    settle(user, now);
    db.save();
    return depositView(d);
  }

  // ---- Withdrawals ----------------------------------------------------------------------

  function withdrawalQuote(amountCents) {
    const fx = usdNgn();
    const feeCents = withdrawalFeeCents(amountCents);
    const netCents = amountCents - feeCents;
    return {
      amountCents,
      amount: fromCents(amountCents),
      feeCents,
      fee: fromCents(feeCents),
      rate: fx.rate,
      receiveKobo: Math.max(0, Math.floor(netCents * fx.rate)), // cents × ₦/$ = kobo
      receiveNgn: Math.max(0, Math.floor(netCents * fx.rate)) / 100,
      asOf: fx.asOf,
      source: fx.source,
    };
  }

  function withdraw(user, { amountCents, bankCode, accountNumber }) {
    if (amountCents < 200) throw badRequest('below_minimum', 'The minimum withdrawal is $2.');
    const q = withdrawalQuote(amountCents);
    if (amountCents > user.balances.usdCents) throw badRequest('insufficient_funds', `You have $${fromCents(user.balances.usdCents).toFixed(2)} available to withdraw.`);
    const resolved = cleva.resolveAccount({ bankCode, accountNumber, fallbackName: user.name });
    if (!resolved.ok) throw badRequest(resolved.reason, resolved.reason === 'unknown_bank' ? 'Choose a bank from the list.' : 'We couldn’t verify that account number. Check the 10 digits and try again.');
    const payout = cleva.startPayout({ amountKobo: q.receiveKobo, bankCode, accountNumber });
    const now = Date.now();
    user.balances.usdCents -= amountCents;
    const w = {
      id: id('wd'),
      userId: user.id,
      amountCents,
      feeCents: q.feeCents,
      rate: q.rate,
      receiveKobo: q.receiveKobo,
      bankCode,
      bankName: resolved.bank.name,
      accountNumber,
      accountName: resolved.accountName,
      reference: payout.reference,
      status: 'processing',
      createdAt: new Date(now).toISOString(),
      settleAt: new Date(now + payoutDelay()).toISOString(),
    };
    s().withdrawals.push(w);
    addActivity(user.id, { type: 'withdrawal', refId: w.id, status: 'pending', title: `Withdrawal to ${resolved.bank.name}`, amountCents: -amountCents, receiveKobo: q.receiveKobo, direction: 'out' });
    settle(user, now);
    db.save();
    return w;
  }

  // ---- Orders ---------------------------------------------------------------------------

  async function placeOrder(user, { symbol, side, notionalCents, all }) {
    const stock = BY_SYMBOL[symbol];
    if (!stock) throw notFound('We don’t support that stock yet.');
    if (side !== 'buy' && side !== 'sell') throw badRequest('invalid_side', 'Choose buy or sell.');
    const q = await quote(symbol);
    const holding = user.holdings[symbol] ?? { micro: 0, costCents: 0 };
    const holdingValueCents = Math.floor((holding.micro / MICRO) * q.price * 100);

    // "Sell all" may close a position worth less than $1 (e.g. a $1 reward after a dip).
    if (side === 'sell' && all) {
      if (holding.micro <= 0) throw badRequest('no_position', `You don’t own any ${stock.name} yet.`);
      notionalCents = Math.max(1, holdingValueCents);
    } else if (!notionalCents || notionalCents < 100) {
      throw badRequest('below_minimum', 'The minimum order is $1.');
    }

    let micro;
    if (side === 'buy') {
      if (notionalCents > user.balances.usdCents) {
        throw badRequest('insufficient_funds', `You have $${fromCents(user.balances.usdCents).toFixed(2)} to invest. Deposit USDT to add more.`);
      }
      micro = Math.floor((notionalCents / 100 / q.price) * MICRO);
    } else {
      if (holding.micro <= 0) throw badRequest('no_position', `You don’t own any ${stock.name} yet.`);
      if (notionalCents > holdingValueCents) throw badRequest('insufficient_shares', `Your ${stock.name} is worth $${fromCents(holdingValueCents).toFixed(2)}. Sell that amount or less.`);
      micro = all ? holding.micro : Math.min(holding.micro, Math.ceil((notionalCents / 100 / q.price) * MICRO));
    }

    const orderId = id('ord');
    let broker = { broker: 'sandbox' };
    if (alpaca.enabled) {
      try {
        broker = { broker: 'alpaca-paper', ...(await alpaca.placeOrder({ symbol, side, notionalUsd: notionalCents / 100, clientOrderId: orderId })) };
      } catch (err) {
        throw conflict('broker_rejected', `The broker rejected this order: ${err.message}`);
      }
    }

    if (side === 'buy') {
      user.balances.usdCents -= notionalCents;
      holding.micro += micro;
      holding.costCents += notionalCents;
    } else {
      const costShare = Math.round(holding.costCents * (micro / holding.micro));
      holding.micro -= micro;
      holding.costCents -= costShare;
      user.balances.usdCents += notionalCents;
    }
    if (holding.micro <= 0) delete user.holdings[symbol];
    else user.holdings[symbol] = holding;

    const order = {
      id: orderId,
      userId: user.id,
      symbol,
      side,
      notionalCents,
      price: q.price,
      micro,
      shares: fromMicro(micro),
      status: 'filled',
      ...broker,
      createdAt: new Date().toISOString(),
    };
    s().orders.push(order);
    addActivity(user.id, {
      type: side,
      refId: orderId,
      title: `${side === 'buy' ? 'Bought' : 'Sold'} ${stock.name}`,
      symbol,
      shares: order.shares,
      amountCents: side === 'buy' ? -notionalCents : notionalCents,
      direction: side === 'buy' ? 'out' : 'in',
    });
    db.save();
    return { ...order, notional: fromCents(notionalCents) };
  }

  // ---- Learn-to-Earn rewards ------------------------------------------------------------

  async function grantReward(user, courseId) {
    const course = COURSES[courseId];
    if (user.completedCourses[courseId]) throw conflict('already_rewarded', 'You already earned the reward for this lesson.');
    const q = await quote(course.reward.symbol);
    const cents = course.reward.usd * 100;
    const micro = Math.floor((course.reward.usd / q.price) * MICRO);
    const holding = user.holdings[course.reward.symbol] ?? { micro: 0, costCents: 0 };
    holding.micro += micro;
    holding.costCents += cents;
    user.holdings[course.reward.symbol] = holding;
    const reward = { courseId, symbol: course.reward.symbol, usd: course.reward.usd, shares: fromMicro(micro), price: q.price, at: new Date().toISOString() };
    user.completedCourses[courseId] = reward;
    addActivity(user.id, { type: 'reward', refId: `${user.id}:${courseId}`, title: `Reward: $${course.reward.usd} of ${BY_SYMBOL[course.reward.symbol].name}`, symbol: course.reward.symbol, shares: reward.shares, amountCents: 0, valueCents: cents, direction: 'in' });
    db.save();
    return reward;
  }

  // ---- Portfolio ------------------------------------------------------------------------

  async function portfolio(user) {
    const symbols = Object.keys(user.holdings);
    const qs = await quotes(symbols);
    let investedCents = 0;
    let dayChangeCents = 0;
    let costCents = 0;
    const holdings = symbols.map((symbol) => {
      const h = user.holdings[symbol];
      const st = BY_SYMBOL[symbol];
      const qq = qs[symbol];
      const shares = h.micro / MICRO;
      const valueCents = Math.round(shares * qq.price * 100);
      investedCents += valueCents;
      costCents += h.costCents;
      dayChangeCents += Math.round(shares * qq.change * 100);
      const plCents = valueCents - h.costCents;
      return {
        symbol,
        name: st.name,
        sector: st.sector,
        shares: fromMicro(h.micro),
        price: qq.price,
        changePct: qq.changePct,
        value: fromCents(valueCents),
        cost: fromCents(h.costCents),
        pl: fromCents(plCents),
        plPct: h.costCents ? plCents / h.costCents : 0,
      };
    }).sort((a, b) => b.value - a.value);

    const cashCents = user.balances.usdCents;
    const totalCents = cashCents + investedCents;
    const allocation = [
      ...holdings.map((h) => ({ key: h.symbol, label: h.name, kind: 'stock', value: h.value })),
      { key: 'USD', label: 'USD reserve (from USDT)', kind: 'cash', value: fromCents(cashCents) },
    ].map((a) => ({ ...a, pct: totalCents ? Math.round(a.value * 100) / totalCents : 0 }));

    const deposited = s().deposits.filter((d) => d.userId === user.id && d.status === 'credited').reduce((n, d) => n + d.amountCents, 0);
    const pendingDeposits = s().deposits.filter((d) => d.userId === user.id && d.status === 'confirming').reduce((n, d) => n + d.amountCents, 0);
    const withdrawnKobo = s().withdrawals.filter((w) => w.userId === user.id).reduce((n, w) => n + w.receiveKobo, 0);

    return {
      cash: fromCents(cashCents),
      invested: fromCents(investedCents),
      total: fromCents(totalCents),
      cost: fromCents(costCents),
      pl: fromCents(investedCents - costCents),
      dayChange: fromCents(dayChangeCents),
      holdings,
      allocation,
      route: {
        usdtIn: fromCents(deposited),
        usdtPending: fromCents(pendingDeposits),
        usd: fromCents(cashCents),
        stocks: fromCents(investedCents),
        ngnOut: withdrawnKobo / 100,
      },
    };
  }

  return { settle, simulateDeposit, depositView, withdrawalQuote, withdraw, placeOrder, grantReward, portfolio, addActivity };
}
