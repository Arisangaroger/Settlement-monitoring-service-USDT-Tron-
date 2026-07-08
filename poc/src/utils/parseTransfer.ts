import { rawAmountToDecimal } from './amount.js';
import { computeConfirmations, confirmationStatus } from './confirmations.js';
import type {
  ParsedIncomingTransfer,
  TronGridTrc20Transfer,
} from '../types/trongrid.js';

export function isIncomingUsdtTransfer(
  transfer: TronGridTrc20Transfer,
  monitoredWallet: string,
  usdtContractAddress: string,
): boolean {
  const isTransfer = transfer.type === 'Transfer';
  const isToMonitoredWallet =
    transfer.to.toLowerCase() === monitoredWallet.toLowerCase();
  const isOfficialUsdt =
    transfer.token_info.address.toLowerCase() ===
    usdtContractAddress.toLowerCase();

  return isTransfer && isToMonitoredWallet && isOfficialUsdt;
}

export function parseTransfer(
  transfer: TronGridTrc20Transfer,
  blockNumber: number,
  latestBlockNumber: number,
  confirmationThreshold: number,
): ParsedIncomingTransfer {
  const confirmations = computeConfirmations(latestBlockNumber, blockNumber);

  return {
    transactionHash: transfer.transaction_id,
    senderAddress: transfer.from,
    recipientAddress: transfer.to,
    amountRaw: transfer.value,
    amountUsdt: rawAmountToDecimal(
      transfer.value,
      transfer.token_info.decimals,
    ),
    tokenSymbol: transfer.token_info.symbol,
    contractAddress: transfer.token_info.address,
    blockNumber,
    blockTimestamp: new Date(transfer.block_timestamp).toISOString(),
    confirmations,
    confirmationStatus: confirmationStatus(
      confirmations,
      confirmationThreshold,
    ),
    transferType: transfer.type,
  };
}
