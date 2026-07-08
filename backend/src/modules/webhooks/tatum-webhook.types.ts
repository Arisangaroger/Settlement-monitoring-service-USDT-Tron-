export interface TatumTokenMetadata {
  type?: string;
  symbol: string;
  name?: string;
  decimals: number;
}

export interface TatumWebhookPayload {
  kind: string;
  blockHash?: string;
  blockNumber: number;
  blockTimestamp: number;
  txId: string;
  txTimestamp?: number;
  from: string;
  to: string;
  value: string;
  contractAddress: string;
  currency?: string;
  logIndex?: number;
  tokenMetadata: TatumTokenMetadata;
  chain: string;
  subscriptionId?: string;
  subscriptionType?: string;
}
