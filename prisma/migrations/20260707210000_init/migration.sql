-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "ConfirmationStatus" AS ENUM ('pending', 'confirmed');

-- CreateEnum
CREATE TYPE "ProcessingStatus" AS ENUM ('new', 'processed', 'duplicate_ignored', 'failed');

-- CreateEnum
CREATE TYPE "TransactionSource" AS ENUM ('webhook', 'poll');

-- CreateTable
CREATE TABLE "monitoring_wallets" (
    "id" UUID NOT NULL,
    "address" VARCHAR(34) NOT NULL,
    "label" VARCHAR(100),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "last_synced_block" BIGINT,
    "last_synced_timestamp" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "monitoring_wallets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" UUID NOT NULL,
    "wallet_id" UUID NOT NULL,
    "transaction_hash" CHAR(64) NOT NULL,
    "sender_address" VARCHAR(34) NOT NULL,
    "recipient_address" VARCHAR(34) NOT NULL,
    "amount" DECIMAL(38,6) NOT NULL,
    "amount_raw" VARCHAR(78) NOT NULL,
    "token_symbol" VARCHAR(20) NOT NULL,
    "contract_address" VARCHAR(34) NOT NULL,
    "block_number" BIGINT NOT NULL,
    "block_timestamp" TIMESTAMPTZ(6) NOT NULL,
    "confirmations" INTEGER NOT NULL DEFAULT 0,
    "confirmation_status" "ConfirmationStatus" NOT NULL DEFAULT 'pending',
    "processing_status" "ProcessingStatus" NOT NULL DEFAULT 'new',
    "source" "TransactionSource" NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "transactions_amount_positive" CHECK ("amount" > 0)
);

-- CreateTable
CREATE TABLE "webhook_events_log" (
    "id" UUID NOT NULL,
    "raw_payload" JSONB NOT NULL,
    "received_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "error_message" TEXT,

    CONSTRAINT "webhook_events_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "monitoring_wallets_address_key" ON "monitoring_wallets"("address");

-- CreateIndex
CREATE UNIQUE INDEX "transactions_transaction_hash_key" ON "transactions"("transaction_hash");

-- CreateIndex
CREATE INDEX "transactions_confirmation_status_idx" ON "transactions"("confirmation_status");

-- CreateIndex
CREATE INDEX "transactions_block_number_idx" ON "transactions"("block_number");

-- CreateIndex
CREATE INDEX "transactions_recipient_address_idx" ON "transactions"("recipient_address");

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "monitoring_wallets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
