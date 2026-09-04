export interface AccountLimitsRepository {
  findDailyLimitAndBalance(numberAccount: string): Promise<{
    balance: number;
    dailyLimit: number;
  } | null>;
}
