import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ValidateLimitDto } from './validate-limit.dto';

describe('ValidateLimitDto', () => {
  it('accepts a valid query', async () => {
    const dto = plainToInstance(ValidateLimitDto, {
      account: '123456-7',
      amount: '10.50',
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
    expect(dto.amount).toBe(10.5);
  });

  it('rejects invalid account and amount', async () => {
    const errors = await validate(plainToInstance(ValidateLimitDto, {
      account: 'invalid',
      amount: '-1',
    }));

    expect(errors.length).toBeGreaterThan(0);
  });
});