import { MonitoringWallet } from '@prisma/client';
import { MonitoredWalletResponseDto } from './dto/monitored-wallet-response.dto';

export function toMonitoredWalletResponseDto(
  wallet: MonitoringWallet,
): MonitoredWalletResponseDto {
  return {
    id: wallet.id,
    address: wallet.address,
    label: wallet.label,
    active: wallet.active,
    lastSyncedBlock: wallet.lastSyncedBlock?.toString() ?? null,
    lastSyncedTimestamp: wallet.lastSyncedTimestamp?.toISOString() ?? null,
  };
}
