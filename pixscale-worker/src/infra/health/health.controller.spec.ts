import { HealthController } from './health.controller';

describe('HealthController', () => {
  it('reports liveness', () => {
    const controller = new HealthController({ ping: jest.fn() } as any, { ping: jest.fn() } as any);
    expect(controller.live()).toEqual({ status: 'ok' });
  });

  it('reports readiness when Redis and PostgreSQL are available', async () => {
    const repository = { ping: jest.fn().mockResolvedValue(undefined) };
    const cache = { ping: jest.fn().mockResolvedValue(undefined) };
    await expect(new HealthController(repository as any, cache as any).ready()).resolves.toEqual({
      status: 'ready', dependencies: { postgres: 'ok', redis: 'ok' },
    });
  });
});
