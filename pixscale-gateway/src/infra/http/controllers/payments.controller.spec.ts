import { PaymentsController } from './payments.controller';
import { ProcessPaymentUseCase } from '../../../application/use-cases/process-payment.use-case';

describe('PaymentsController', () => {
  it('delegates the request to the payment use case', async () => {
    const useCase = {
      execute: jest.fn().mockResolvedValue({
        message: 'Payment received successfully and sent to processing queue.',
        idempotency_key: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        status: 'PROCESSING',
      }),
    } as unknown as ProcessPaymentUseCase;
    const controller = new PaymentsController(useCase);
    const payment = {
      idempotency_key: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      destination_account_number: '998877-6',
      amount: 10,
      device_fingerprint: 'device-hash',
    };

    await expect(controller.receivePayment(payment)).resolves.toEqual({
      message: 'Payment received successfully and sent to processing queue.',
      idempotency_key: payment.idempotency_key,
      status: 'PROCESSING',
    });
    expect(useCase.execute).toHaveBeenCalledWith(payment);
  });

  it('translates a rejected payment into a bad request', async () => {
    const useCase = {
      execute: jest.fn().mockResolvedValue({ status: 'REJECTED', reason: 'EXCEEDS_DAILY_LIMIT' }),
    } as unknown as ProcessPaymentUseCase;

    await expect(new PaymentsController(useCase).receivePayment({} as any)).rejects.toMatchObject({
      response: { reason: 'EXCEEDS_DAILY_LIMIT' },
    });
  });
});
