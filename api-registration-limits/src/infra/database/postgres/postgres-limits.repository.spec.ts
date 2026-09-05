import { PostgresLimitsRepository } from './postgres-limits.repository';

jest.mock('@nestjs/config', () => ({
  ConfigService: class ConfigService {},
}));

const poolMock = { query: jest.fn(), end: jest.fn() };

jest.mock('pg', () => ({
  Pool: jest.fn(() => poolMock),
}));

describe('PostgresLimitsRepository', () => {
  let repository: PostgresLimitsRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    repository = new PostgresLimitsRepository({ get: jest.fn() } as any);
  });

  it('returns the financial profile with numeric values', async () => {
    await repository.onModuleInit();
    poolMock.query.mockResolvedValueOnce({
      rows: [{ balance: '900.00', daily_limit: '1000.00', daily_spent: '250.00' }],
    });

    await expect(repository.findDailyLimitAndBalance('123456-7')).resolves.toEqual({
      balance: 900,
      dailyLimit: 1000,
      dailySpent: 250,
    });
  });

  it('returns null when the account does not exist', async () => {
    await repository.onModuleInit();
    poolMock.query.mockResolvedValueOnce({ rows: [] });

    await expect(repository.findDailyLimitAndBalance('missing')).resolves.toBeNull();
  });

  it('closes the pool on shutdown', async () => {
    await repository.onModuleInit();
    await repository.onModuleDestroy();

    expect(poolMock.end).toHaveBeenCalledTimes(1);
  });

  it('pings PostgreSQL', async () => {
    await repository.onModuleInit();
    poolMock.query.mockResolvedValueOnce({ rows: [] });
    await expect(repository.ping()).resolves.toBeUndefined();
    expect(poolMock.query).toHaveBeenCalledWith('SELECT 1');
  });
});
