import { HealthController } from './health.controller';

jest.mock('@nestjs/axios', () => ({ HttpService: class HttpService {} }));
jest.mock('rxjs', () => ({ firstValueFrom: jest.fn().mockResolvedValue({ status: 200 }) }));

describe('HealthController', () => {
  it('reports liveness', () => {
    const controller = new HealthController({ get: jest.fn() } as any, {} as any);
    expect(controller.live()).toEqual({ status: 'ok' });
  });

  it('reports limits readiness', async () => {
    const http = { get: jest.fn().mockReturnValue({}) };
    const config = { get: jest.fn().mockReturnValue('http://limits') };
    const controller = new HealthController(config as any, http as any);
    await expect(controller.ready()).resolves.toEqual({ status: 'ready' });
  });
});
