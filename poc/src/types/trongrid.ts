export interface TronGridTokenInfo {
  symbol: string;
  address: string;
  decimals: number;
  name: string;
}

export interface TronGridTrc20Transfer {
  transaction_id: string;
  token_info: TronGridTokenInfo;
  block_timestamp: number;
  from: string;
  to: string;
  type: string;
  value: string;
}

export interface TronGridTrc20Response {
  success: boolean;
  data: TronGridTrc20Transfer[];
  meta?: {
    at: number;
    page_size: number;
    fingerprint?: string;
    links?: {
      next?: string;
    };
  };
  error?: string;
  statusCode?: number;
}

export interface TronGridErrorResponse {
  success: false;
  error: string;
  statusCode?: number;
}

export interface TransactionInfoById {
  id: string;
  blockNumber: number;
  blockTimeStamp: number;
  fee?: number;
  receipt?: {
    result?: string;
  };
}

export interface LatestBlockResponse {
  block_header: {
    raw_data: {
      number: number;
      timestamp: number;
    };
  };
}

export interface ParsedIncomingTransfer {
  transactionHash: string;
  senderAddress: string;
  recipientAddress: string;
  amountRaw: string;
  amountUsdt: string;
  tokenSymbol: string;
  contractAddress: string;
  blockNumber: number;
  blockTimestamp: string;
  confirmations: number;
  confirmationStatus: 'pending' | 'confirmed';
  transferType: string;
}
