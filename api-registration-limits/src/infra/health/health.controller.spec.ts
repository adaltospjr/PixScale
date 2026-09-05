import { HealthController } from './health.controller';

describe('HealthController', () => {
  it('reports liveness', () => {
    const controller = new HealthController({ ping: jest.fn() } as any);
    expect(controller.live()).toEqual({ status: 'ok' });
  });

  it('reports database readiness', async () => {
    const repository = { ping: jest.fn().mockResolvedValue(undefined) };
    await expect(new HealthController(repository as any).ready()).resolves.toEqual({ status: 'ready' });
  });
});
