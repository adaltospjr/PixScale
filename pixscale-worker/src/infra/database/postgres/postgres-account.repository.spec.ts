import { PostgresAccountRepository } from './postgres-account.repository';

const poolMock = {
  query: jest.fn(),
  connect: jest.fn(),
  end: jest.fn(),
};

jest.mock('pg', () => ({
  Pool: jest.fn(() => poolMock),
}));

describe('PostgresAccountRepository', () => {
  let repository: PostgresAccountRepository;
  let client: { query: jest.Mock; release: jest.Mock };

  beforeEach(() => {
    jest.clearAllMocks();
    repository = new PostgresAccountRepository();
    client = { query: jest.fn(), release: jest.fn() };
    poolMock.connect.mockResolvedValue(client);
  });

  it('creates and closes the connection pool', async () => {
    await repository.onModuleInit();
    await repository.onModuleDestroy();

    expect(poolMock.end).toHaveBeenCalledTimes(1);
  });

  it('finds an account by number', async () => {
    await repository.onModuleInit();
    poolMock.query.mockResolvedValueOnce({ rows: [{ id: 'account-id' }] });

    await expect(repository.findAccountByNumber('123456-7')).resolves.toEqual({ id: 'account-id' });
    expect(poolMock.query).toHaveBeenCalledWith(
      'SELECT * FROM accounts WHERE number_account = $1',
      ['123456-7'],
    );
  });

  it('returns null when the account does not exist', async () => {
    await repository.onModuleInit();
    poolMock.query.mockResolvedValueOnce({ rows: [] });

    await expect(repository.findAccountByNumber('missing')).resolves.toBeNull();
  });

  it('debits, credits and records a liquidation', async () => {
    await repository.onModuleInit();
    client.query
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce({ rowCount: 0 })
      .mockResolvedValueOnce({ rowCount: 1 })
      .mockResolvedValueOnce({ rowCount: 1 })
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(undefined);

    await expect(repository.executeLiquidation('123456-7', '998877-6', 10, 'key-1')).resolves.toBe(true);

    expect(client.query).toHaveBeenCalledWith('COMMIT');
    expect(client.release).toHaveBeenCalledTimes(1);
  });

  it('returns true without changing balances for a duplicate transaction', async () => {
    await repository.onModuleInit();
    client.query
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce({ rowCount: 1 })
      .mockResolvedValueOnce(undefined);

    await expect(repository.executeLiquidation('123456-7', '998877-6', 10, 'key-1')).resolves.toBe(true);

    expect(client.query).toHaveBeenCalledWith('ROLLBACK');
    expect(client.release).toHaveBeenCalledTimes(1);
  });

  it('rolls back when the origin account has insufficient funds', async () => {
    await repository.onModuleInit();
    client.query
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce({ rowCount: 0 })
      .mockResolvedValueOnce({ rowCount: 0 });

    await expect(repository.executeLiquidation('123456-7', '998877-6', 10, 'key-2')).resolves.toBe(false);

    expect(client.query).toHaveBeenCalledWith('ROLLBACK');
    expect(client.release).toHaveBeenCalledTimes(1);
  });

  it('rolls back when the destination account does not exist', async () => {
    await repository.onModuleInit();
    client.query
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce({ rowCount: 0 })
      .mockResolvedValueOnce({ rowCount: 1 })
      .mockResolvedValueOnce({ rowCount: 0 })
      .mockResolvedValueOnce(undefined);

    await expect(repository.executeLiquidation('123456-7', 'missing', 10, 'key-3')).resolves.toBe(false);

    expect(client.query).toHaveBeenCalledWith('ROLLBACK');
  });

  it('returns false and releases no client when connection fails', async () => {
    await repository.onModuleInit();
    poolMock.connect.mockRejectedValueOnce(new Error('database unavailable'));

    await expect(repository.executeLiquidation('123456-7', '998877-6', 10, 'key-4')).resolves.toBe(false);
  });
});
