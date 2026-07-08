import type { IngestionResultStatus } from '../ingestion/ingestion.types';

export interface WebhookHandleResult {
  txId: string;
  status: IngestionResultStatus;
  auditLogId: string;
}
