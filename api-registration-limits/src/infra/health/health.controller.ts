import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import type { AccountLimitsRepository } from '../../domain/repository/account-limits-repository.interface';

@Controller('health')
export class HealthController {
  constructor(@Inject('ACCOUNT_LIMITS_REPOSITORY') private readonly repository: AccountLimitsRepository) {}

  @Get('live')
  live() {
    return { status: 'ok' };
  }

  @Get('ready')
  async ready() {
    try {
      await this.repository.ping();
      return { status: 'ready' };
    } catch {
      throw new ServiceUnavailableException({ status: 'not_ready', dependencies: { postgres: 'unavailable' } });
    }
  }
}