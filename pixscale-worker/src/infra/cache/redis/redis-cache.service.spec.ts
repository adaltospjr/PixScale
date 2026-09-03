import Redis from 'ioredis';
import { RedisCacheService } from './redis-cache.service';

const redisClientMock = {
  get: jest.fn(),
  set: jest.fn(),
  quit: jest.fn(),
};

jest.mock('ioredis', () => jest.fn(() => redisClientMock));

const RedisMock = Redis as jest.MockedClass<typeof Redis>;

describe('RedisCacheService', () => {
  let service: RedisCacheService;
  const originalRedisPort = process.env.REDIS_PORT;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new RedisCacheService();
    redisClientMock.get.mockResolvedValue(null);
    redisClientMock.set.mockResolvedValue('OK');
    redisClientMock.quit.mockResolvedValue('OK');
    delete process.env.REDIS_PORT;
  });

  afterAll(() => {
    if (originalRedisPort === undefined) {
      delete process.env.REDIS_PORT;
    } else {
      process.env.REDIS_PORT = originalRedisPort;
    }
  });

  it('creates the Redis client using the configured port', async () => {
    process.env.REDIS_PORT = '6380';

    await service.onModuleInit();

    expect(RedisMock).toHaveBeenCalledWith({
      host: 'localhost',
      port: 6380,
      maxRetriesPerRequest: 3,
    });
  });

  it('uses port 6379 when REDIS_PORT is not configured', async () => {
    await service.onModuleInit();

    expect(RedisMock).toHaveBeenCalledWith({
      host: 'localhost',
      port: 6379,
      maxRetriesPerRequest: 3,
    });
  });

  it('gets a value by key', async () => {
    await service.onModuleInit();
    redisClientMock.get.mockResolvedValueOnce('COMPLETED');

    await expect(service.get('payment-key')).resolves.toBe('COMPLETED');
    expect(redisClientMock.get).toHaveBeenCalledWith('payment-key');
  });

  it('returns null when the key does not exist', async () => {
    await service.onModuleInit();

    await expect(service.get('missing-key')).resolves.toBeNull();
  });

  it('sets a value with an expiration in seconds', async () => {
    await service.onModuleInit();

    await expect(service.set('payment-key', 'PROCESSING', 30)).resolves.toBeUndefined();
    expect(redisClientMock.set).toHaveBeenCalledWith(
      'payment-key',
      'PROCESSING',
      'EX',
      30,
    );
  });

  it('closes the Redis connection', async () => {
    await service.onModuleInit();

    await service.onModuleDestroy();

    expect(redisClientMock.quit).toHaveBeenCalledTimes(1);
  });

  it('propagates Redis errors', async () => {
    await service.onModuleInit();
    redisClientMock.get.mockRejectedValueOnce(new Error('Redis unavailable'));

    await expect(service.get('payment-key')).rejects.toThrow('Redis unavailable');
  });
});
