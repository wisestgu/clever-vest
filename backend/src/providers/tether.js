import crypto from 'node:crypto';

// Tether (USDT) deposit rail. In sandbox mode Dollo generates correctly formatted deposit
// addresses that NO ONE holds keys for, so the UI must never present them as real. Incoming
// transfers are simulated through POST /api/wallet/deposits/simulate.

export const NETWORKS = {
  TRC20: {
    id: 'TRC20',
    chain: 'Tron',
    minDepositUsd: 1,
    confirmations: 19,
    etaSeconds: 60,
    typicalFeeUsd: 1,
    warning: 'Send only USDT on the Tron (TRC20) network to this address. Other coins, or USDT on any other network, will be lost.',
  },
  ERC20: {
    id: 'ERC20',
    chain: 'Ethereum',
    minDepositUsd: 10,
    confirmations: 12,
    etaSeconds: 180,
    typicalFeeUsd: 4,
    warning: 'Send only USDT on the Ethereum (ERC20) network to this address. Ethereum fees are higher, so we recommend at least 10 USDT.',
  },
};

const B58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

function base58(buf) {
  let n = BigInt(`0x${buf.toString('hex')}`);
  let out = '';
  while (n > 0n) {
    out = B58[Number(n % 58n)] + out;
    n /= 58n;
  }
  for (const byte of buf) {
    if (byte !== 0) break;
    out = `1${out}`;
  }
  return out;
}

const sha256 = (b) => crypto.createHash('sha256').update(b).digest();

export function tronAddress() {
  const payload = Buffer.concat([Buffer.from([0x41]), crypto.randomBytes(20)]);
  const checksum = sha256(sha256(payload)).subarray(0, 4);
  return base58(Buffer.concat([payload, checksum]));
}

export function ethAddress() {
  return `0x${crypto.randomBytes(20).toString('hex')}`;
}

export function createWallets() {
  return {
    TRC20: { network: 'TRC20', address: tronAddress(), mode: 'sandbox' },
    ERC20: { network: 'ERC20', address: ethAddress(), mode: 'sandbox' },
  };
}

export function fakeTxHash(network) {
  const hex = crypto.randomBytes(32).toString('hex');
  return network === 'ERC20' ? `0x${hex}` : hex;
}
