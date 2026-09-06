import { ValidateTransactionLimitUseCase } from './validate-transaction-limit.use-case';

describe('ValidateTransactionLimitUseCase', () => {
  const repository = { findDailyLimitAndBalance: jest.fn() };
  const useCase = new ValidateTransactionLimitUseCase(repository);

  beforeEach(() => jest.clearAllMocks());

  it('allows a transaction within the remaining daily limit and balance', async () => {
    repository.findDailyLimitAndBalance.mockResolvedValue({
      dailyLimit: 1000,
      dailySpent: 200,
      balance: 900,
    });

    await expect(useCase.execute('123456-7', 300)).resolves.toEqual({ allowed: true });
  });

  it('rejects an unknown account', async () => {
    repository.findDailyLimitAndBalance.mockResolvedValue(null);

    await expect(useCase.execute('missing', 10)).resolves.toEqual({
      allowed: false,
      reason: 'ACCOUNT_NOT_FOUND',
    });
  });

  it('rejects a transaction that exceeds the remaining daily limit', async () => {
    repository.findDailyLimitAndBalance.mockResolvedValue({
      dailyLimit: 1000,
      dailySpent: 900,
      balance: 900,
    });

    await expect(useCase.execute('123456-7', 101)).resolves.toEqual({
      allowed: false,
      reason: 'EXCEEDS_DAILY_LIMIT',
    });
  });

  it('rejects a transaction above the available balance', async () => {
    repository.findDailyLimitAndBalance.mockResolvedValue({
      dailyLimit: 1000,
      dailySpent: 100,
      balance: 50,
    });

    await expect(useCase.execute('123456-7', 51)).resolves.toEqual({
      allowed: false,
      reason: 'INSUFFICIENT_FUNDS',
    });
  });
});
