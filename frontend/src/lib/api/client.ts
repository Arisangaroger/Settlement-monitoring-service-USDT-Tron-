import type {
  ApiErrorResponse,
  ListTransactionsParams,
  MonitoredWallet,
  PaginatedTransactions,
  Stats,
  Transaction,
} from './types';

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api';

export class ApiClientError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      ...init?.headers,
    },
    cache: 'no-store',
  });

  const body: unknown = await res.json().catch(() => null);

  if (!res.ok) {
    const err = body as ApiErrorResponse | null;
    throw new ApiClientError(
      err?.error?.message ?? `Request failed (${res.status})`,
      res.status,
      err?.error?.code,
    );
  }

  return body as T;
}

function buildQuery(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') {
      search.set(key, String(value));
    }
  }
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

export async function getStats(): Promise<Stats> {
  const res = await request<{ data: Stats }>('/stats');
  return res.data;
}

export async function getTransactions(
  params: ListTransactionsParams = {},
): Promise<PaginatedTransactions> {
  const res = await request<{ data: Transaction[]; meta: PaginatedTransactions['meta'] }>(
    `/transactions${buildQuery({
      page: params.page ?? 1,
      limit: params.limit ?? 10,
      confirmationStatus: params.confirmationStatus,
      sortBy: params.sortBy ?? 'block_timestamp',
      order: params.order ?? 'desc',
    })}`,
  );
  return { data: res.data, meta: res.meta };
}

export async function getTransactionById(id: string): Promise<Transaction> {
  const res = await request<{ data: Transaction }>(`/transactions/${id}`);
  return res.data;
}

export async function searchByHash(hash: string): Promise<Transaction> {
  const res = await request<{ data: Transaction }>(
    `/transactions/search${buildQuery({ hash })}`,
  );
  return res.data;
}

export async function getHealth(): Promise<{ status: string; database: string }> {
  const res = await request<{ data: { status: string; database: string } }>(
    '/health',
  );
  return res.data;
}

export async function getMonitoredWallet(): Promise<MonitoredWallet> {
  const res = await request<{ data: MonitoredWallet }>('/wallets/monitored');
  return res.data;
}

export async function setMonitoredWallet(address: string): Promise<MonitoredWallet> {
  const res = await request<{ data: MonitoredWallet }>('/wallets/monitored', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address }),
  });
  return res.data;
}
