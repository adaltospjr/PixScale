import { LiquidatePaymentUseCase } from './liquidate-payment.use-case';

describe('LiquidatePaymentUseCase', () => {
  it('liquidates the payment using the origin fallback', async () => {
    const repository = {
      executeLiquidation: jest.fn().mockResolvedValue(true),
    };
    const logSpy = jest.spyOn(console, 'log').mockImplementation();
    const payment = { amount: 12.5, destination_account_number: '998877-6' };

    await new LiquidatePaymentUseCase(repository).execute(payment);

    expect(logSpy).toHaveBeenCalledWith(
      '[PixScale] [UseCase] Pix de R$ 12.5 liquidado com SUCESSO e salvo no Postgres!',
    );
    expect(repository.executeLiquidation).toHaveBeenCalledWith(
      '123456-7',
      '998877-6',
      12.5,
      undefined,
    );
    logSpy.mockRestore();
  });
});
