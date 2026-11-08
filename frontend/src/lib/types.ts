export type Network = 'TRC20' | 'ERC20';

export interface UsdAccount {
  provider: string;
  mode: string;
  accountName: string;
  bankName: string;
  accountNumber: string;
  routingNumber: string;
  accountType: string;
  currency: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  usdAccount: UsdAccount;
  wallets: Record<Network, { network: Network; address: string; mode: string }>;
  completedCourses: Record<string, Reward>;
}

export interface Reward {
  courseId: string;
  symbol: string;
  usd: number;
  shares: number;
  price: number;
  at: string;
}

export interface NetworkInfo {
  id: Network;
  chain: string;
  minDepositUsd: number;
  confirmations: number;
  etaSeconds: number;
  typicalFeeUsd: number;
  warning: string;
}

export interface Deposit {
  id: string;
  network: Network;
  amount: number;
  address: string;
  txHash: string;
  status: 'confirming' | 'credited';
  createdAt: string;
  creditAt: string;
  confirmations: number;
  requiredConfirmations: number;
}

export interface Wallet {
  balance: { usd: number };
  usdAccount: UsdAccount;
  addresses: (NetworkInfo & { network: Network; address: string; mode: string })[];
  deposits: Deposit[];
}

export interface Quote {
  symbol: string;
  price: number;
  prevClose: number;
  change: number;
  changePct: number;
  asOf: string;
  source: string;
}

export interface Listing {
  symbol: string;
  name: string;
  sector: string;
  price: number | null;
  change: number | null;
  changePct: number | null;
  risk: number;
}

export interface StockSnapshot extends Listing {
  about: string;
  quote: Quote;
  range: Range;
  history: { t: number; p: number }[];
  explain: {
    marketCap: { value: number; text: string };
    revenueGrowth: { value: number; text: string };
    risk: { score: number; label: string; text: string };
    dividend: { value: number; text: string };
  };
  collections: { id: string; name: string }[];
}

export type Range = '1D' | '1W' | '1M' | '3M' | '1Y';

export interface InsiderTrade {
  id: string;
  symbol: string;
  name: string;
  role: string;
  type: 'buy' | 'sell';
  shares: number;
  price: number;
  value: number;
  filedAt: string;
  source: string;
  headline: string;
  meaning: string;
  quote: Quote | null;
}

export interface Collection {
  id: string;
  name: string;
  blurb: string;
  symbols: string[];
  stocks: Listing[];
}

export interface Holding {
  symbol: string;
  name: string;
  sector: string;
  shares: number;
  price: number;
  changePct: number;
  value: number;
  cost: number;
  pl: number;
  plPct: number;
}

export interface Portfolio {
  cash: number;
  invested: number;
  total: number;
  cost: number;
  pl: number;
  dayChange: number;
  holdings: Holding[];
  allocation: { key: string; label: string; kind: 'stock' | 'cash'; value: number; pct: number }[];
  route: { usdtIn: number; usdtPending: number; usd: number; stocks: number; ngnOut: number };
}

export interface Order {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  notional: number;
  price: number;
  shares: number;
  status: string;
  broker: string;
  createdAt: string;
}

export interface WithdrawalQuote {
  amount: number;
  fee: number;
  rate: number;
  receiveNgn: number;
  asOf: string;
}

export interface Withdrawal {
  id: string;
  amountCents: number;
  feeCents: number;
  rate: number;
  receiveKobo: number;
  bankName: string;
  accountNumber: string;
  accountName: string;
  reference: string;
  status: 'processing' | 'completed';
  createdAt: string;
  settleAt: string;
}

export interface Bank {
  code: string;
  name: string;
}

export interface Activity {
  id: string;
  type: 'deposit' | 'buy' | 'sell' | 'reward' | 'withdrawal';
  title: string;
  status: 'pending' | 'completed';
  amount: number;
  value?: number;
  receiveNgn?: number;
  symbol?: string;
  shares?: number;
  direction: 'in' | 'out';
  createdAt: string;
}

export interface CourseSummary {
  id: string;
  title: string;
  topic: string;
  minutes: number;
  reward: { symbol: string; usd: number; name: string };
  completed: boolean;
  earned: Reward | null;
  questions?: number;
}

export interface Course extends CourseSummary {
  cards: { title: string; body: string }[];
  quiz: { q: string; options: string[] }[];
}
