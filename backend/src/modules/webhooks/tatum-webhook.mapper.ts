import type { TronGridTrc20Transfer } from '../blockchain/blockchain.types';
import {
  humanAmountToRaw,
  isOfficialUsdtContract,
  isValidTronAddress,
  isValidTxHash,
} from '../blockchain/blockchain.utils';
import type { TronNetwork } from '../config/configuration';
import type { TatumWebhookPayload } from './tatum-webhook.types';

export class TatumWebhookMapError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TatumWebhookMapError';
  }
}

const TRON_TESTNET_CHAINS = new Set([
  'tron-testnet',
  'tron-shasta',
  'tron-nile',
]);
const TRON_MAINNET_CHAINS = new Set(['tron-mainnet']);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function parseTatumWebhookPayload(
  body: Record<string, unknown>,
): TatumWebhookPayload {
  if (!isRecord(body)) {
    throw new TatumWebhookMapError('Payload must be a JSON object');
  }

  const tokenMetadata = body.tokenMetadata;
  if (!isRecord(tokenMetadata)) {
    throw new TatumWebhookMapError('Missing tokenMetadata');
  }

  const decimals = tokenMetadata.decimals;
  if (typeof decimals !== 'number' || !Number.isInteger(decimals) || decimals < 0) {
    throw new TatumWebhookMapError('Invalid tokenMetadata.decimals');
  }

  const requiredStringFields = [
    'kind',
    'txId',
    'from',
    'to',
    'value',
    'contractAddress',
    'chain',
  ] as const;

  for (const field of requiredStringFields) {
    if (typeof body[field] !== 'string' || !body[field].trim()) {
      throw new TatumWebhookMapError(`Missing or invalid ${field}`);
    }
  }

  if (typeof body.blockNumber !== 'number' || body.blockNumber <= 0) {
    throw new TatumWebhookMapError('Invalid blockNumber');
  }

  if (typeof body.blockTimestamp !== 'number' || body.blockTimestamp <= 0) {
    throw new TatumWebhookMapError('Invalid blockTimestamp');
  }

  if (typeof tokenMetadata.symbol !== 'string' || !tokenMetadata.symbol.trim()) {
    throw new TatumWebhookMapError('Invalid tokenMetadata.symbol');
  }

  return {
    kind: body.kind as string,
    blockHash: typeof body.blockHash === 'string' ? body.blockHash : undefined,
    blockNumber: body.blockNumber,
    blockTimestamp: body.blockTimestamp,
    txId: body.txId as string,
    txTimestamp:
      typeof body.txTimestamp === 'number' ? body.txTimestamp : undefined,
    from: body.from as string,
    to: body.to as string,
    value: body.value as string,
    contractAddress: body.contractAddress as string,
    currency: typeof body.currency === 'string' ? body.currency : undefined,
    logIndex: typeof body.logIndex === 'number' ? body.logIndex : undefined,
    tokenMetadata: {
      type: typeof tokenMetadata.type === 'string' ? tokenMetadata.type : undefined,
      symbol: tokenMetadata.symbol as string,
      name: typeof tokenMetadata.name === 'string' ? tokenMetadata.name : undefined,
      decimals,
    },
    chain: body.chain as string,
    subscriptionId:
      typeof body.subscriptionId === 'string' ? body.subscriptionId : undefined,
    subscriptionType:
      typeof body.subscriptionType === 'string'
        ? body.subscriptionType
        : undefined,
  };
}

function assertChainMatchesNetwork(chain: string, tronNetwork: TronNetwork): void {
  const isTestnet = TRON_TESTNET_CHAINS.has(chain);
  const isMainnet = TRON_MAINNET_CHAINS.has(chain);

  if (tronNetwork === 'mainnet' && !isMainnet) {
    throw new TatumWebhookMapError(`Chain "${chain}" does not match mainnet config`);
  }
  if (tronNetwork !== 'mainnet' && !isTestnet) {
    throw new TatumWebhookMapError(`Chain "${chain}" does not match testnet config`);
  }
}

/** Map Tatum ADDRESS_EVENT payload to the same shape TronGrid polling uses internally. */
export function mapTatumWebhookToTrc20Transfer(params: {
  payload: TatumWebhookPayload;
  expectedUsdtContract: string;
  tronNetwork: TronNetwork;
}): TronGridTrc20Transfer {
  const { payload, expectedUsdtContract, tronNetwork } = params;

  if (payload.kind !== 'token_transfer') {
    throw new TatumWebhookMapError(`Unsupported event kind: ${payload.kind}`);
  }

  assertChainMatchesNetwork(payload.chain, tronNetwork);

  if (!isValidTxHash(payload.txId)) {
    throw new TatumWebhookMapError('Invalid txId format');
  }
  if (!isValidTronAddress(payload.from)) {
    throw new TatumWebhookMapError('Invalid from address');
  }
  if (!isValidTronAddress(payload.to)) {
    throw new TatumWebhookMapError('Invalid to address');
  }
  if (!isValidTronAddress(payload.contractAddress)) {
    throw new TatumWebhookMapError('Invalid contractAddress');
  }

  if (
    !isOfficialUsdtContract(payload.contractAddress, expectedUsdtContract)
  ) {
    throw new TatumWebhookMapError('Contract address is not official USDT');
  }

  let amountRaw: string;
  try {
    amountRaw = humanAmountToRaw(payload.value, payload.tokenMetadata.decimals);
  } catch {
    throw new TatumWebhookMapError('Invalid token value');
  }

  if (BigInt(amountRaw) <= 0n) {
    throw new TatumWebhookMapError('Transfer amount must be positive');
  }

  return {
    transaction_id: payload.txId,
    token_info: {
      symbol: payload.tokenMetadata.symbol,
      address: payload.contractAddress,
      decimals: payload.tokenMetadata.decimals,
      name: payload.tokenMetadata.name ?? payload.tokenMetadata.symbol,
    },
    block_timestamp: payload.blockTimestamp,
    from: payload.from,
    to: payload.to,
    type: 'Transfer',
    value: amountRaw,
  };
}
