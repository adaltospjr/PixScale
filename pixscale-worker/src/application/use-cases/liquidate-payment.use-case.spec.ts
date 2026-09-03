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
    const payment = { amount: 12.5, destination_account_number: '998877-6' };

    await new LiquidatePaymentUseCase(repository, cache).execute(payment);

    expect(logSpy).toHaveBeenCalledWith(
      '[PixScale] [UseCase] Pix de R$ 12.5 liquidado com SUCESSO e salvo no Postgres!',
    );
    expect(repository.executeLiquidation).toHaveBeenCalledWith(
      '123456-7',
      '998877-6',
      12.5,
      undefined,
    );
    expect(cache.set).toHaveBeenNthCalledWith(1, undefined, 'PROCESSING', 30);
    expect(cache.set).toHaveBeenNthCalledWith(2, undefined, 'COMPLETED', 300);
    logSpy.mockRestore();
  });
});
