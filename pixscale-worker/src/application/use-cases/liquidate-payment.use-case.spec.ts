import { LiquidatePaymentUseCase } from './liquidate-payment.use-case';

describe('LiquidatePaymentUseCase', () => {
  it('logs the received payment payload', async () => {
    const logSpy = jest.spyOn(console, 'log').mockImplementation();
    const payment = { amount: 12.5, destination_account_number: '998877-6' };

    await new LiquidatePaymentUseCase().execute(payment);

    expect(logSpy).toHaveBeenCalledWith(
      '[PixScale] [UseCase] Payload recebido para processamento:',
      payment,
    );
    logSpy.mockRestore();
  });
});
