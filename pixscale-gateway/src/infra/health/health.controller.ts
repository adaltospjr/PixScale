import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';

@Controller('health')
export class HealthController {
  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {}

  @Get('live')
  live() {
    return { status: 'ok' };
  }

  @Get('ready')
  async ready() {
    const limitsUrl = this.configService.get<string>('API_REGISTRATION_LIMITS_URL') || 'http://localhost:3001';
    try {
      await firstValueFrom(this.httpService.get(`${limitsUrl}/health/live`));
      return { status: 'ready' };
    } catch {
      throw new ServiceUnavailableException({ status: 'not_ready', dependencies: { limitsApi: 'unavailable' } });
    }
  }
}
