import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreatePaymentDto } from './create-payment.dto';

async function validationErrors(input: Record<string, unknown>) {
  return validate(plainToInstance(CreatePaymentDto, input));
}

describe('CreatePaymentDto', () => {
  it('accepts a valid payment', async () => {
    const errors = await validationErrors({
      idempotency_key: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      destination_account_number: '998877-6',
      amount: 10.25,
      device_fingerprint: 'device-hash',
    });

    expect(errors).toHaveLength(0);
  });

  it.each([
    ['invalid idempotency key', { idempotency_key: 'invalid' }],
    ['invalid account number', { destination_account_number: '998877' }],
    ['zero amount', { amount: 0 }],
    ['negative amount', { amount: -1 }],
    ['amount with too many decimals', { amount: 10.123 }],
    ['empty fingerprint', { device_fingerprint: '' }],
  ])('rejects %s', async (_description, field) => {
    const errors = await validationErrors({
      idempotency_key: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      destination_account_number: '998877-6',
      amount: 10,
      device_fingerprint: 'device-hash',
      ...field,
    });

    expect(errors.length).toBeGreaterThan(0);
  });
});
