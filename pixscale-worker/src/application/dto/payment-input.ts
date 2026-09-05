export interface PaymentInput {
  idempotency_key: string;
  origin_account_number: string;
  destination_account_number: string;
  amount: number;
  device_fingerprint?: string;
}

export type LiquidationResult =
  | { success: true }
  | { success: false; reason: 'DUPLICATE_TRANSACTION' | 'POSTGRES_TRANSACTION_FAILED' };
