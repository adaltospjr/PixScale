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
      setIfAbsent: jest.fn().mockResolvedValue(true),
    };
    const logSpy = jest.spyOn(console, 'log').mockImplementation();
    const payment = {
      amount: 12.5,
      destination_account_number: '998877-6',
      idempotency_key: 'payment-key',
      origin_account_number: '123456-7',
    };

    await new LiquidatePaymentUseCase(repository as any, cache as any).execute(payment);

    expect(logSpy).toHaveBeenCalledWith(
      '[PixScale] [UseCase] Pix de R$ 12.5 liquidado com SUCESSO e salvo no Postgres e Redis!',
    );
    expect(repository.executeLiquidation).toHaveBeenCalledWith(
      '123456-7',
      '998877-6',
      12.5,
      'payment-key',
    );
    expect(cache.setIfAbsent).toHaveBeenCalledWith('payment-key', 'PROCESSING', 30);
    expect(cache.set).toHaveBeenCalledWith('payment-key', 'COMPLETED', 300);
    logSpy.mockRestore();
  });

  it('blocks a duplicated payment found in the cache', async () => {
    const repository = { findAccountByNumber: jest.fn(), executeLiquidation: jest.fn() };
    const cache = {
      get: jest.fn().mockResolvedValue('COMPLETED'),
      set: jest.fn(),
      setIfAbsent: jest.fn(),
    };

    await expect(new LiquidatePaymentUseCase(repository as any, cache as any).execute({
      idempotency_key: 'payment-key',
      destination_account_number: '998877-6',
      amount: 10,
      origin_account_number: '123456-7',
    })).resolves.toEqual({ success: false, reason: 'DUPLICATE_TRANSACTION' });
    expect(repository.executeLiquidation).not.toHaveBeenCalled();
  });

  it('marks the payment as failed when the repository rejects it', async () => {
    const repository = {
      findAccountByNumber: jest.fn(),
      executeLiquidation: jest.fn().mockResolvedValue(false),
    };
    const cache = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue(undefined),
      setIfAbsent: jest.fn().mockResolvedValue(true),
    };

    await expect(new LiquidatePaymentUseCase(repository as any, cache as any).execute({
      idempotency_key: 'payment-key',
      destination_account_number: '998877-6',
      amount: 10,
      origin_account_number: '123456-7',
    })).resolves.toEqual({ success: false, reason: 'POSTGRES_TRANSACTION_FAILED' });
    expect(cache.set).toHaveBeenCalledWith('payment-key', 'FAILED', 60);
  });
});
