import { Injectable, Logger } from '@nestjs/common';
import {
  ConfirmationStatus,
  Prisma,
  ProcessingStatus,
  TransactionSource,
} from '@prisma/client';
import { AppConfigService } from '../config/app-config.service';
import {
  computeConfirmations,
  deriveConfirmationStatus,
  isOfficialUsdtContract,
  isValidTronAddress,
  isValidTxHash,
  rawAmountToDecimal,
} from '../blockchain/blockchain.utils';
import type { TronGridTrc20Transfer } from '../blockchain/blockchain.types';
import { TronGridClient } from '../blockchain/trongrid.client';
import { PrismaService } from '../prisma/prisma.service';
import {
  IngestionResult,
  IngestTransactionInput,
} from './ingestion.types';

@Injectable()
export class IngestionService {
  private readonly logger = new Logger(IngestionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly appConfig: AppConfigService,
    private readonly tronGrid: TronGridClient,
  ) {}

  async processTransaction(
    input: IngestTransactionInput,
  ): Promise<IngestionResult> {
    const hash = input.transactionHash;

    try {
      const validationError = this.validateInput(input);
      if (validationError) {
        this.logger.warn({ hash, reason: validationError }, 'Ingestion rejected');
        return { status: 'rejected', transactionHash: hash, reason: validationError };
      }

      const cfg = this.appConfig.get();
      if (
        !isOfficialUsdtContract(input.contractAddress, cfg.usdtContractAddress)
      ) {
        const reason = 'Contract address is not official USDT';
        this.logger.warn({ hash, reason }, 'Ingestion rejected');
        return { status: 'rejected', transactionHash: hash, reason };
      }

      await this.prisma.transaction.create({
        data: {
          walletId: input.walletId,
          transactionHash: input.transactionHash,
          senderAddress: input.senderAddress,
          recipientAddress: input.recipientAddress,
          amount: input.amount,
          amountRaw: input.amountRaw,
          tokenSymbol: input.tokenSymbol,
          contractAddress: input.contractAddress,
          blockNumber: BigInt(input.blockNumber),
          blockTimestamp: input.blockTimestamp,
          confirmations: input.confirmations,
          confirmationStatus:
            input.confirmationStatus === 'confirmed'
              ? ConfirmationStatus.confirmed
              : ConfirmationStatus.pending,
          processingStatus: ProcessingStatus.new,
          source: input.source,
        },
      });

      this.logger.log({ hash, source: input.source }, 'Transaction inserted');
      return { status: 'inserted', transactionHash: hash };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        this.logger.debug({ hash }, 'Duplicate transaction ignored');
        return { status: 'duplicate_ignored', transactionHash: hash };
      }

      const reason = error instanceof Error ? error.message : String(error);
      this.logger.error({ hash, reason }, 'Ingestion failed');
      return { status: 'failed', transactionHash: hash, reason };
    }
  }

  async processTrc20Transfer(params: {
    walletId: string;
    monitoredAddress: string;
    transfer: TronGridTrc20Transfer;
    latestBlockNumber: number;
    source: TransactionSource;
    blockNumber?: number;
  }): Promise<IngestionResult> {
    const cfg = this.appConfig.get();
    const { transfer } = params;

    if (transfer.type !== 'Transfer') {
      return {
        status: 'rejected',
        transactionHash: transfer.transaction_id,
        reason: 'Not a Transfer event',
      };
    }

    if (
      transfer.to.toLowerCase() !== params.monitoredAddress.toLowerCase()
    ) {
      return {
        status: 'rejected',
        transactionHash: transfer.transaction_id,
        reason: 'Recipient is not monitored wallet',
      };
    }

    const blockNumber =
      params.blockNumber ??
      (await this.tronGrid.getTransactionInfoById(transfer.transaction_id))
        .blockNumber;

    const confirmations = computeConfirmations(
      params.latestBlockNumber,
      blockNumber,
    );

    const input: IngestTransactionInput = {
      walletId: params.walletId,
      transactionHash: transfer.transaction_id,
      senderAddress: transfer.from,
      recipientAddress: transfer.to,
      amountRaw: transfer.value,
      amount: rawAmountToDecimal(transfer.value, transfer.token_info.decimals),
      tokenSymbol: transfer.token_info.symbol,
      contractAddress: transfer.token_info.address,
      blockNumber,
      blockTimestamp: new Date(transfer.block_timestamp),
      confirmations,
      confirmationStatus: deriveConfirmationStatus(
        confirmations,
        cfg.confirmationThreshold,
      ),
      source: params.source,
    };

    return this.processTransaction(input);
  }

  private validateInput(input: IngestTransactionInput): string | null {
    if (!isValidTxHash(input.transactionHash)) {
      return 'Invalid transaction hash format';
    }
    if (!isValidTronAddress(input.senderAddress)) {
      return 'Invalid sender address';
    }
    if (!isValidTronAddress(input.recipientAddress)) {
      return 'Invalid recipient address';
    }
    if (!isValidTronAddress(input.contractAddress)) {
      return 'Invalid contract address';
    }
    if (!/^\d+$/.test(input.amountRaw) || BigInt(input.amountRaw) <= 0n) {
      return 'Amount raw must be a positive integer string';
    }
    const amountNum = Number(input.amount);
    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      return 'Amount must be positive';
    }
    if (input.blockNumber <= 0) {
      return 'Invalid block number';
    }
    return null;
  }
}
