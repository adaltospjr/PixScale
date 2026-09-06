import { createHmac } from 'node:crypto';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtGuard } from './jwt.guard';

function token(payload: Record<string, unknown>, secret = 'secret') {
  const encode = (value: unknown) => Buffer.from(JSON.stringify(value)).toString('base64url');
  const header = encode({ alg: 'HS256', typ: 'JWT' });
  const body = encode(payload);
  const signature = createHmac('sha256', secret).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${signature}`;
}

const context = (authorization?: string) => ({
  switchToHttp: () => ({ getRequest: () => ({ headers: { authorization } }) }),
} as unknown as ExecutionContext);

describe('JwtGuard', () => {
  it('accepts a valid token', () => {
    const config = { get: jest.fn((key: string) => key === 'JWT_SECRET' ? 'secret' : undefined) };
    const guard = new JwtGuard(config as any);
    expect(guard.canActivate(context(`Bearer ${token({ sub: 'user-1', exp: Math.floor(Date.now() / 1000) + 60 })}`))).toBe(true);
  });

  it('rejects expired and malformed tokens', () => {
    const config = { get: jest.fn().mockReturnValue('secret') };
    const guard = new JwtGuard(config as any);
    expect(() => guard.canActivate(context('Bearer invalid'))).toThrow(UnauthorizedException);
    expect(() => guard.canActivate(context(`Bearer ${token({ sub: 'user-1', exp: 1 })}`))).toThrow(UnauthorizedException);
  });
});
