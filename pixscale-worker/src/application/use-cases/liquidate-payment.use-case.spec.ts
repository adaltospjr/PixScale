import { LiquidatePaymentUseCase } from './liquidate-payment.use-case';

describe('LiquidatePaymentUseCase', () => {
  it('liquidates the payment using the origin fallback', async () => {
    const repository = {
      findAccountByNumber: jest.fn(),
      executeLiquidation: jest.fn().mockResolvedValue(true),
    };
    const cache = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue(undefined),
    };
    const logSpy = jest.spyOn(console, 'log').mockImplementation();
    const payment = {
      amount: 12.5,
      destination_account_number: '998877-6',
      idempotency_key: 'payment-key',
    };

    await new LiquidatePaymentUseCase(repository, cache).execute(payment);

    expect(logSpy).toHaveBeenCalledWith(
      '[PixScale] [UseCase] Pix de R$ 12.5 liquidado com SUCESSO e salvo no Postgres e Redis!',
    );
    expect(repository.executeLiquidation).toHaveBeenCalledWith(
      '123456-7',
      '998877-6',
      12.5,
      'payment-key',
    );
    expect(cache.set).toHaveBeenNthCalledWith(1, 'payment-key', 'PROCESSING', 30);
    expect(cache.set).toHaveBeenNthCalledWith(2, 'payment-key', 'COMPLETED', 300);
    logSpy.mockRestore();
  });

  it('blocks a duplicated payment found in the cache', async () => {
    const repository = { executeLiquidation: jest.fn() };
    const cache = {
      get: jest.fn().mockResolvedValue('COMPLETED'),
      set: jest.fn(),
    };

    await expect(new LiquidatePaymentUseCase(repository, cache).execute({
      idempotency_key: 'payment-key',
      destination_account_number: '998877-6',
      amount: 10,
    })).resolves.toEqual({ success: false, reason: 'DUPLICATE_TRANSACTION' });
    expect(repository.executeLiquidation).not.toHaveBeenCalled();
  });

  it('marks the payment as failed when the repository rejects it', async () => {
    const repository = {
      executeLiquidation: jest.fn().mockResolvedValue(false),
    };
    const cache = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue(undefined),
    };

    await expect(new LiquidatePaymentUseCase(repository, cache).execute({
      idempotency_key: 'payment-key',
      destination_account_number: '998877-6',
      amount: 10,
    })).resolves.toEqual({ success: false, reason: 'POSTGRES_TRANSACTION_FAILED' });
    expect(cache.set).toHaveBeenNthCalledWith(2, 'payment-key', 'FAILED', 60);
  });
});
