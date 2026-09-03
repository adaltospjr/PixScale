import { PaymentsController } from './payments.controller';
import type { KafkaMessageBrokerAdapter } from '../../messaging/kafka-message-broker.adapter';

describe('PaymentsController', () => {
  it('delegates the request to the payment use case', async () => {
    const adapter = {
      publish: jest.fn().mockResolvedValue(undefined),
    } as unknown as KafkaMessageBrokerAdapter;
    const controller = new PaymentsController(adapter);
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
    expect(adapter.publish).toHaveBeenCalledWith('pix-transactions', payment.idempotency_key, payment);
  });
});
