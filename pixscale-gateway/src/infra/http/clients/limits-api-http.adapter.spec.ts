import { LimitsApiHttpAdapter } from './limits-api-http.adapter';

jest.mock('@nestjs/axios', () => ({
  HttpService: class HttpService {},
}));

const firstValueFromMock = jest.fn();

jest.mock('rxjs', () => ({
  firstValueFrom: (...args: unknown[]) => firstValueFromMock(...args),
}));

describe('LimitsApiHttpAdapter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls the limits API with account and amount parameters', async () => {
    const request = {};
    const httpService = { get: jest.fn().mockReturnValue(request) };
    const configService = { get: jest.fn().mockReturnValue('http://limits:3001') };
    firstValueFromMock.mockResolvedValueOnce({ data: { allowed: true } });
    const adapter = new LimitsApiHttpAdapter(httpService as any, configService as any);

    await expect(adapter.validate('123456-7', 25.5)).resolves.toEqual({ allowed: true });

    expect(httpService.get).toHaveBeenCalledWith('http://limits:3001/limits/validate', {
      params: { account: '123456-7', amount: 25.5 },
    });
    expect(firstValueFromMock).toHaveBeenCalledWith(request);
  });

  it('uses the default limits API URL when configuration is absent', async () => {
    const httpService = { get: jest.fn().mockReturnValue({}) };
    const configService = { get: jest.fn().mockReturnValue(undefined) };
    firstValueFromMock.mockResolvedValueOnce({ data: { allowed: false, reason: 'ACCOUNT_NOT_FOUND' } });
    const adapter = new LimitsApiHttpAdapter(httpService as any, configService as any);

    await adapter.validate('missing', 10);

    expect(httpService.get).toHaveBeenCalledWith('http://localhost:3001/limits/validate', {
      params: { account: 'missing', amount: 10 },
    });
  });
});
