import { createHmac, timingSafeEqual } from 'node:crypto';
import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface JwtClaims {
  sub: string;
  exp: number;
  iss?: string;
  aud?: string;
}

@Injectable()
export class JwtGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const authorization = context.switchToHttp().getRequest<{ headers: Record<string, string | undefined> }>().headers.authorization;
    const token = authorization?.startsWith('Bearer ') ? authorization.slice(7) : undefined;
    const claims = token ? this.verify(token) : null;

    if (!claims) {
      throw new UnauthorizedException('Valid Bearer token is required.');
    }

    return true;
  }

  private verify(token: string): JwtClaims | null {
    try {
      const [encodedHeader, encodedPayload, encodedSignature] = token.split('.');
      if (!encodedHeader || !encodedPayload || !encodedSignature) return null;

      const header = JSON.parse(Buffer.from(encodedHeader, 'base64url').toString()) as { alg?: string; typ?: string };
      const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString()) as JwtClaims;
      const secret = this.configService.get<string>('JWT_SECRET');
      const issuer = this.configService.get<string>('JWT_ISSUER');
      const audience = this.configService.get<string>('JWT_AUDIENCE');

      if (!secret || header.alg !== 'HS256' || header.typ !== 'JWT' || !payload.sub || !payload.exp) return null;
      if (payload.exp <= Math.floor(Date.now() / 1000)) return null;
      if (issuer && payload.iss !== issuer) return null;
      if (audience && payload.aud !== audience) return null;

      const expected = createHmac('sha256', secret)
        .update(`${encodedHeader}.${encodedPayload}`)
        .digest();
      const actual = Buffer.from(encodedSignature, 'base64url');
      return actual.length === expected.length && timingSafeEqual(actual, expected) ? payload : null;
    } catch {
      return null;
    }
  }
}
