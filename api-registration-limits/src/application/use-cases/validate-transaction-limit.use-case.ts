import { Injectable, Inject } from '@nestjs/common'; // 🌟 Importe o Injectable e Inject
import { type AccountLimitsRepository } from '../../domain/repository/account-limits-repository.interface';

@Injectable()
export class ValidateTransactionLimitUseCase {
  constructor(
    @Inject('ACCOUNT_LIMITS_REPOSITORY')
    private readonly limitsRepository: AccountLimitsRepository,
  ) {}

  async execute(numberAccount: string, amount: number): Promise<{ allowed: boolean; reason?: string }> {
    console.log(`[PixScale] [UseCase] Validando limite para a conta ${numberAccount} com valor R$ ${amount}`);

    const accountData = await this.limitsRepository.findDailyLimitAndBalance(numberAccount);

    console.log(accountData);

    if (!accountData) {
      return { allowed: false, reason: 'ACCOUNT_NOT_FOUND' };
    }

    if (amount > accountData.dailyLimit) {
      return { allowed: false, reason: 'EXCEEDS_DAILY_LIMIT' };
    }

    if (amount > accountData.balance) {
      return { allowed: false, reason: 'INSUFFICIENT_FUNDS' };
    }

    return { allowed: true };
  }
}
