export interface AccountFinancialProfile {
  balance: number;
  dailyLimit: number;
  dailySpent: number;
}

export interface AccountLimitsRepository {
  ping(): Promise<void>;
  findDailyLimitAndBalance(numberAccount: string): Promise<AccountFinancialProfile | null>;
}
