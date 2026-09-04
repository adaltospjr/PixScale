export interface TransactionLimitChecker {
  validate(
    accountNumber: string,
    amount: number,
  ): Promise<{ allowed: boolean; reason?: string }>;
}
