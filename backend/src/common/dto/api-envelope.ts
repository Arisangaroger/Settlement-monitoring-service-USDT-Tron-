export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiSuccessResponse<T, M = Record<string, unknown>> {
  data: T;
  meta?: M;
}

export interface ApiErrorBody {
  code: string;
  message: string;
}

export interface ApiErrorResponse {
  error: ApiErrorBody;
}

export function successResponse<T, M = Record<string, unknown>>(
  data: T,
  meta?: M,
): ApiSuccessResponse<T, M> {
  return meta !== undefined ? { data, meta } : { data };
}

export function paginatedResponse<T>(
  data: T[],
  meta: PaginationMeta,
): ApiSuccessResponse<T[], PaginationMeta> {
  return { data, meta };
}
