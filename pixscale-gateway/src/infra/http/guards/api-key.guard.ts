import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const expectedKey = this.configService.get<string>('GATEWAY_API_KEY');
    const environment = this.configService.get<string>('NODE_ENV') || 'development';

    if (!expectedKey) {
      if (environment === 'production') {
        throw new UnauthorizedException('Gateway API key is not configured.');
      }
      return true;
    }

    const request = context.switchToHttp().getRequest<{ headers: Record<string, string | undefined> }>();
    if (request.headers['x-api-key'] !== expectedKey) {
      throw new UnauthorizedException('Invalid API key.');
    }

    return true;
  }
}
