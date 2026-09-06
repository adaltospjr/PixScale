import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ApiKeyGuard } from './api-key.guard';

describe('ApiKeyGuard', () => {
  const context = (headers: Record<string, string | undefined>): ExecutionContext => ({
    switchToHttp: () => ({ getRequest: () => ({ headers }) }) as any,
  } as ExecutionContext);

  it('allows local development when no key is configured', () => {
    const config = { get: jest.fn().mockReturnValue(undefined) };

    expect(new ApiKeyGuard(config as any).canActivate(context({}))).toBe(true);
  });

  it('rejects production when the key is not configured', () => {
    const config = { get: jest.fn((key: string) => key === 'NODE_ENV' ? 'production' : undefined) };

    expect(() => new ApiKeyGuard(config as any).canActivate(context({}))).toThrow(UnauthorizedException);
  });

  it('accepts the configured key', () => {
    const config = { get: jest.fn((key: string) => key === 'GATEWAY_API_KEY' ? 'secret' : 'production') };

    expect(new ApiKeyGuard(config as any).canActivate(context({ 'x-api-key': 'secret' }))).toBe(true);
  });

  it('rejects an invalid key', () => {
    const config = { get: jest.fn((key: string) => key === 'GATEWAY_API_KEY' ? 'secret' : 'production') };

    expect(() => new ApiKeyGuard(config as any).canActivate(context({ 'x-api-key': 'wrong' }))).toThrow(UnauthorizedException);
  });
});
