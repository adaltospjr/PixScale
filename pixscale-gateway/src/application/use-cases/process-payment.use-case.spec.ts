import { ProcessPaymentUseCase } from './process-payment.use-case';
import type { MessagingBroker } from '../../domain/messaging/messaging-broker.interface';
import type { TransactionLimitChecker } from '../ports/transaction-limit-checker.interface';

describe('ProcessPaymentUseCase', () => {
  const limitChecker: jest.Mocked<TransactionLimitChecker> = {
    validate: jest.fn().mockResolvedValue({ allowed: true }),
  };
  const idempotencyRepository = { claim: jest.fn().mockResolvedValue('CLAIMED'), release: jest.fn() };

  it('publishes the payment and returns processing status', async () => {
    const broker: jest.Mocked<MessagingBroker> = {
      publish: jest.fn().mockResolvedValue(undefined),
    };
    const payment = {
      idempotency_key: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      origin_account_number: '123456-7',
      destination_account_number: '998877-6',
      amount: 25.5,
      device_fingerprint: 'device-hash',
    };

    const result = await new ProcessPaymentUseCase(broker, limitChecker, idempotencyRepository).execute(payment);

    expect(limitChecker.validate).toHaveBeenCalledWith('123456-7', payment.amount);
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

    await expect(new ProcessPaymentUseCase(broker, limitChecker, idempotencyRepository).execute({
      idempotency_key: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      origin_account_number: '123456-7',
      destination_account_number: '998877-6',
      amount: 10,
      device_fingerprint: 'device-hash',
    })).rejects.toThrow('payment dependencies is temporarily unavailable.');
  });

  it('rejects payments denied by the limits service without publishing', async () => {
    const broker: jest.Mocked<MessagingBroker> = { publish: jest.fn() };
    const checker: jest.Mocked<TransactionLimitChecker> = {
      validate: jest.fn().mockResolvedValue({ allowed: false, reason: 'EXCEEDS_DAILY_LIMIT' }),
    };

    await expect(new ProcessPaymentUseCase(broker, checker, idempotencyRepository).execute({
      idempotency_key: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      origin_account_number: '123456-7',
      destination_account_number: '998877-6',
      amount: 10,
      device_fingerprint: 'device-hash',
    })).resolves.toEqual({ status: 'REJECTED', reason: 'EXCEEDS_DAILY_LIMIT' });
    expect(broker.publish).not.toHaveBeenCalled();
    expect(idempotencyRepository.release).toHaveBeenCalled();
  });

  it('returns the existing processing result for a duplicate request', async () => {
    const broker: jest.Mocked<MessagingBroker> = { publish: jest.fn() };
    const repository = { claim: jest.fn().mockResolvedValue('DUPLICATE'), release: jest.fn() };
    const payment = {
      idempotency_key: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      origin_account_number: '123456-7', destination_account_number: '998877-6',
      amount: 10, device_fingerprint: 'device-hash',
    };

    await expect(new ProcessPaymentUseCase(broker, limitChecker, repository).execute(payment))
      .resolves.toEqual({ status: 'PROCESSING', idempotency_key: payment.idempotency_key });
    expect(broker.publish).not.toHaveBeenCalled();
  });

  it('releases the idempotency claim when publishing fails', async () => {
    const broker: jest.Mocked<MessagingBroker> = { publish: jest.fn().mockRejectedValue(new Error('Kafka down')) };
    const repository = { claim: jest.fn().mockResolvedValue('CLAIMED'), release: jest.fn().mockResolvedValue(undefined) };
    const payment = {
      idempotency_key: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      origin_account_number: '123456-7', destination_account_number: '998877-6',
      amount: 10, device_fingerprint: 'device-hash',
    };

    await expect(new ProcessPaymentUseCase(broker, limitChecker, repository).execute(payment)).rejects.toThrow();
    expect(repository.release).toHaveBeenCalledWith(payment.idempotency_key);
  });
});
