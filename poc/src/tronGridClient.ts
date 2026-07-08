import type {
  LatestBlockResponse,
  TransactionInfoById,
  TronGridTrc20Response,
} from './types/trongrid.js';

export class TronGridClient {
  constructor(
    private readonly baseUrl: string,
    private readonly apiKey?: string,
  ) {}

  private headers(): Record<string, string> {
    const headers: Record<string, string> = {
      Accept: 'application/json',
    };
    if (this.apiKey) {
      headers['TRON-PRO-API-KEY'] = this.apiKey;
    }
    return headers;
  }

  private async request<T>(
    path: string,
    init?: RequestInit,
  ): Promise<{ status: number; body: T }> {
    const url = `${this.baseUrl}${path}`;
    const response = await fetch(url, {
      ...init,
      headers: {
        ...this.headers(),
        ...(init?.headers ?? {}),
      },
    });

    const body = (await response.json()) as T;
    return { status: response.status, body };
  }

  async getLatestBlockNumber(): Promise<number> {
    const { body } = await this.request<LatestBlockResponse>(
      '/wallet/getnowblock',
      { method: 'GET' },
    );
    return body.block_header.raw_data.number;
  }

  async getTransactionInfoById(txHash: string): Promise<TransactionInfoById> {
    const { status, body } = await this.request<TransactionInfoById>(
      '/wallet/gettransactioninfobyid',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: txHash }),
      },
    );

    if (status !== 200 || !body.blockNumber) {
      throw new Error(
        `Failed to fetch transaction info for ${txHash} (HTTP ${status})`,
      );
    }

    return body;
  }

  async getTrc20Transfers(params: {
    address: string;
    contractAddress: string;
    limit?: number;
    onlyTo?: boolean;
    onlyConfirmed?: boolean;
    minTimestamp?: number;
    maxTimestamp?: number;
    fingerprint?: string;
    orderBy?: string;
  }): Promise<{ status: number; body: TronGridTrc20Response }> {
    const search = new URLSearchParams();
    search.set('limit', String(params.limit ?? 20));
    search.set('contract_address', params.contractAddress);

    if (params.onlyTo) search.set('only_to', 'true');
    if (params.onlyConfirmed) search.set('only_confirmed', 'true');
    if (params.minTimestamp !== undefined) {
      search.set('min_timestamp', String(params.minTimestamp));
    }
    if (params.maxTimestamp !== undefined) {
      search.set('max_timestamp', String(params.maxTimestamp));
    }
    if (params.fingerprint) search.set('fingerprint', params.fingerprint);
    if (params.orderBy) search.set('order_by', params.orderBy);

    const path = `/v1/accounts/${params.address}/transactions/trc20?${search.toString()}`;
    return this.request<TronGridTrc20Response>(path, { method: 'GET' });
  }
}
