import { digits, id } from '../lib/random.js';

// Cleva rails: USD account issuance and NGN payouts to Nigerian banks.
// This adapter is a faithful-in-shape SANDBOX simulation. Swap the function bodies for real
// Cleva API calls once production credentials and API documentation are available; the rest of
// the backend only depends on these function signatures.

export const mode = process.env.CLEVA_API_KEY ? 'configured' : 'sandbox';

// Commercial banks and fintechs with their NIBSS/CBN institution codes.
export const BANKS = [
  { code: '044', name: 'Access Bank' },
  { code: '058', name: 'Guaranty Trust Bank' },
  { code: '057', name: 'Zenith Bank' },
  { code: '011', name: 'First Bank of Nigeria' },
  { code: '033', name: 'United Bank for Africa' },
  { code: '070', name: 'Fidelity Bank' },
  { code: '035', name: 'Wema Bank' },
  { code: '232', name: 'Sterling Bank' },
  { code: '221', name: 'Stanbic IBTC Bank' },
  { code: '50211', name: 'Kuda Microfinance Bank' },
  { code: '999992', name: 'OPay' },
  { code: '50515', name: 'Moniepoint Microfinance Bank' },
  { code: '100004', name: 'PalmPay' },
];

export function createUsdAccount(user) {
  return {
    provider: 'cleva',
    mode: 'sandbox',
    accountName: user.name,
    bankName: 'Sandbox US Bank (via Cleva)',
    accountNumber: digits(10),
    routingNumber: `0${digits(8)}`,
    accountType: 'Checking',
    currency: 'USD',
  };
}

/** NIBSS-style name enquiry. The sandbox echoes the signed-in user's name for any valid number. */
export function resolveAccount({ bankCode, accountNumber, fallbackName }) {
  const bank = BANKS.find((b) => b.code === bankCode);
  if (!bank) return { ok: false, reason: 'unknown_bank' };
  if (!/^\d{10}$/.test(accountNumber)) return { ok: false, reason: 'invalid_account_number' };
  if (accountNumber === '0000000000') return { ok: false, reason: 'account_not_found' };
  return { ok: true, bank, accountNumber, accountName: fallbackName.toUpperCase() };
}

/** Starts an NGN payout. Sandbox payouts settle a few seconds later (see services/settle.js). */
export function startPayout({ amountKobo, bankCode, accountNumber }) {
  return { reference: id('CLV').toUpperCase().replace('CLV_', 'CLV-'), status: 'processing', amountKobo, bankCode, accountNumber };
}
