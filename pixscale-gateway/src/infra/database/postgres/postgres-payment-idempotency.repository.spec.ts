import { PostgresPaymentIdempotencyRepository } from './postgres-payment-idempotency.repository';

const poolMock = { query: jest.fn(), end: jest.fn() };
jest.mock('pg', () => ({ Pool: jest.fn(() => poolMock) }));

describe('PostgresPaymentIdempotencyRepository', () => {
  let repository: PostgresPaymentIdempotencyRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    repository = new PostgresPaymentIdempotencyRepository({ get: jest.fn() } as any);
  });

  it('claims a new key', async () => {
    await repository.onModuleInit();
    poolMock.query.mockResolvedValueOnce({ rowCount: 1, rows: [] });
    await expect(repository.claim('key', 'hash')).resolves.toBe('CLAIMED');
  });

  it('detects duplicate and conflicting keys', async () => {
    await repository.onModuleInit();
    poolMock.query.mockResolvedValueOnce({ rowCount: 0, rows: [] }).mockResolvedValueOnce({ rows: [{ request_hash: 'hash' }] });
    await expect(repository.claim('key', 'hash')).resolves.toBe('DUPLICATE');

    poolMock.query.mockResolvedValueOnce({ rowCount: 0, rows: [] }).mockResolvedValueOnce({ rows: [{ request_hash: 'other' }] });
    await expect(repository.claim('key', 'hash')).resolves.toBe('CONFLICT');
  });

  it('releases a key and closes the pool', async () => {
    await repository.onModuleInit();
    await repository.release('key');
    await repository.onModuleDestroy();
    expect(poolMock.query).toHaveBeenCalledWith(expect.stringContaining('DELETE FROM'), ['key']);
    expect(poolMock.end).toHaveBeenCalled();
  });
});
