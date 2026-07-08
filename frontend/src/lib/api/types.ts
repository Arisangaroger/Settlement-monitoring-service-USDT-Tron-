export type ConfirmationStatus = 'pending' | 'confirmed';
export type ProcessingStatus = 'new' | 'processed' | 'duplicate_ignored' | 'failed';
export type TransactionSource = 'webhook' | 'poll';

export interface ApiErrorBody {
  code: string;
  message: string;
}

export interface ApiErrorResponse {
  error: ApiErrorBody;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface Transaction {
  id: string;
  transactionHash: string;
  senderAddress: string;
  recipientAddress: string;
  amount: string;
  tokenSymbol: string;
  contractAddress: string;
  blockNumber: string;
  blockTimestamp: string;
  confirmations: number;
  confirmationStatus: ConfirmationStatus;
  processingStatus: ProcessingStatus;
  source: TransactionSource;
  createdAt: string;
  updatedAt: string;
}

export interface Stats {
  totalTransactions: number;
  totalUsdtReceived: string;
  confirmedCount: number;
  pendingCount: number;
}

export interface ListTransactionsParams {
  page?: number;
  limit?: number;
  confirmationStatus?: ConfirmationStatus;
  processingStatus?: ProcessingStatus;
  sortBy?: 'block_timestamp' | 'amount' | 'created_at';
  order?: 'asc' | 'desc';
}

export interface PaginatedTransactions {
  data: Transaction[];
  meta: PaginationMeta;
}

export interface MonitoredWallet {
  id: string;
  address: string;
  label: string | null;
  active: boolean;
  lastSyncedBlock: string | null;
  lastSyncedTimestamp: string | null;
}

export type StatusFilter = 'all' | ConfirmationStatus | 'failed';
