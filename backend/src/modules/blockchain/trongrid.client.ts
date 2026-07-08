import { Injectable, Logger } from '@nestjs/common';
import { AppConfigService } from '../config/app-config.service';
import type {
  LatestBlockResponse,
  TronGridTrc20Response,
  TronGridTrc20Transfer,
  TransactionInfoById,
} from './blockchain.types';
import { sleep } from './blockchain.utils';

const MAX_RETRIES = 2;
const RETRY_BASE_MS = 500;

@Injectable()
export class TronGridClient {
  private readonly logger = new Logger(TronGridClient.name);

  constructor(private readonly appConfig: AppConfigService) {}

  private config() {
    return this.appConfig.get();
  }

  private headers(): Record<string, string> {
    const cfg = this.config();
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (cfg.trongridApiKey) {
      headers['TRON-PRO-API-KEY'] = cfg.trongridApiKey;
    }
    return headers;
  }

  private async request<T>(
    path: string,
    init?: RequestInit,
    attempt = 0,
  ): Promise<{ status: number; body: T }> {
    const cfg = this.config();
    const url = `${cfg.trongridBaseUrl}${path}`;

    try {
      const response = await fetch(url, {
        ...init,
        headers: { ...this.headers(), ...(init?.headers ?? {}) },
      });

      const body = (await response.json()) as T;

      if (
        (response.status === 429 || response.status >= 500) &&
        attempt < MAX_RETRIES
      ) {
        const delay = RETRY_BASE_MS * 2 ** attempt;
        this.logger.warn(
          `TronGrid ${response.status} on ${path}, retry in ${delay}ms`,
        );
        await sleep(delay);
        return this.request(path, init, attempt + 1);
      }

      return { status: response.status, body };
    } catch (error) {
      if (attempt < MAX_RETRIES) {
        const delay = RETRY_BASE_MS * 2 ** attempt;
        this.logger.warn(`TronGrid network error on ${path}, retry in ${delay}ms`);
        await sleep(delay);
        return this.request(path, init, attempt + 1);
      }
      throw error;
    }
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

  async getTrc20TransfersPage(params: {
    address: string;
    contractAddress: string;
    limit?: number;
    onlyTo?: boolean;
    onlyConfirmed?: boolean;
    minTimestamp?: number;
    fingerprint?: string;
    orderBy?: string;
  }): Promise<{ status: number; body: TronGridTrc20Response }> {
    const search = new URLSearchParams();
    search.set('limit', String(params.limit ?? 200));
    search.set('contract_address', params.contractAddress);
    if (params.onlyTo) search.set('only_to', 'true');
    if (params.onlyConfirmed) search.set('only_confirmed', 'true');
    if (params.minTimestamp !== undefined) {
      search.set('min_timestamp', String(params.minTimestamp));
    }
    if (params.fingerprint) search.set('fingerprint', params.fingerprint);
    if (params.orderBy) search.set('order_by', params.orderBy);

    const path = `/v1/accounts/${params.address}/transactions/trc20?${search.toString()}`;
    return this.request<TronGridTrc20Response>(path, { method: 'GET' });
  }

  /** Fetch all pages of incoming TRC20 transfers since minTimestamp. */
  async fetchIncomingTransfersSince(params: {
    walletAddress: string;
    contractAddress: string;
    minTimestamp?: number;
  }): Promise<TronGridTrc20Transfer[]> {
    const all: TronGridTrc20Transfer[] = [];
    let fingerprint: string | undefined;

    do {
      const { status, body } = await this.getTrc20TransfersPage({
        address: params.walletAddress,
        contractAddress: params.contractAddress,
        minTimestamp: params.minTimestamp,
        onlyTo: true,
        onlyConfirmed: true,
        orderBy: 'block_timestamp,asc',
        fingerprint,
      });

      if (status !== 200 || !body.success) {
        throw new Error(
          body.error ?? `TronGrid TRC20 fetch failed (HTTP ${status})`,
        );
      }

      all.push(...body.data);
      fingerprint = body.meta?.fingerprint;

      if (!body.meta?.links?.next || body.data.length === 0) {
        break;
      }
    } while (fingerprint);

    return all;
  }
}
