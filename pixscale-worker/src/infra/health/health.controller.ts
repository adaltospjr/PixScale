import { Controller, Get, Inject, ServiceUnavailableException } from '@nestjs/common';
import type { AccountRepository } from '../../domain/repository/account-repository.interface';
import type { CacheService } from '../../domain/cache/cache-service.interface';

@Controller('health')
export class HealthController {
  constructor(
    @Inject('ACCOUNT_REPOSITORY') private readonly repository: AccountRepository,
    @Inject('CACHE_SERVICE') private readonly cache: CacheService,
  ) {}

  @Get('live')
  live() {
    return { status: 'ok' };
  }

  @Get('ready')
  async ready() {
    const dependencies = await Promise.allSettled([this.repository.ping(), this.cache.ping()]);
    const postgres = dependencies[0].status === 'fulfilled' ? 'ok' : 'unavailable';
    const redis = dependencies[1].status === 'fulfilled' ? 'ok' : 'unavailable';
    if (postgres !== 'ok' || redis !== 'ok') {
      throw new ServiceUnavailableException({ status: 'not_ready', dependencies: { postgres, redis } });
    }

    return { status: 'ready', dependencies: { postgres, redis } };
  }
}