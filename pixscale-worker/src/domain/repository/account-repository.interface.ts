export interface AccountRepository {
  findAccountByNumber(accountNumber: string): Promise<any>;
  executeLiquidation(originAccount: string, destinationAccount: string, amount: number, idempotencyKey: string): Promise<boolean>;
}
