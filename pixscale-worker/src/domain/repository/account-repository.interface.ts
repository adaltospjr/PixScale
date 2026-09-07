export interface AccountRepository {
  ping(): Promise<void>;

  findAccountByNumber(
    accountNumber: string,
  ): Promise<{ id: string; balance: number } | null>;

  executeLiquidation(
    originAccount: string,
    destinationAccount: string,
    amount: number,
    idempotencyKey: string,
  ): Promise<{
    status: 'PROCESSED' | 'DUPLICATE';
    transactionId: string;
  }>;
}