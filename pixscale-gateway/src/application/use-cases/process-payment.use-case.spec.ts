import { ProcessPaymentUseCase } from './process-payment.use-case';
import type { MessagingBroker } from '../../domain/messaging/messaging-broker.interface';

describe('ProcessPaymentUseCase', () => {
  it('publishes the payment and returns processing status', async () => {
    const broker: jest.Mocked<MessagingBroker> = {
      publish: jest.fn().mockResolvedValue(undefined),
    };
    const payment = {
      idempotency_key: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      destination_account_number: '998877-6',
      amount: 25.5,
      device_fingerprint: 'device-hash',
    };

    const result = await new ProcessPaymentUseCase(broker).execute(payment);

    expect(broker.publish).toHaveBeenCalledWith('pix-transactions', payment.idempotency_key, payment);
    expect(result).toEqual({
      message: 'Payment received successfully and sent to processing queue.',
      idempotency_key: payment.idempotency_key,
      status: 'PROCESSING',
    });
  });

  it('propagates broker failures', async () => {
    const error = new Error('Kafka unavailable');
    const broker: jest.Mocked<MessagingBroker> = {
      publish: jest.fn().mockRejectedValue(error),
    };

    await expect(new ProcessPaymentUseCase(broker).execute({
      idempotency_key: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      destination_account_number: '998877-6',
      amount: 10,
      device_fingerprint: 'device-hash',
    })).rejects.toThrow(error);
  });
});
