import { Module } from '@nestjs/common';
import { RedisCacheService } from './redis/redis-cache.service';

@Module({
  providers: [
    {
      provide: 'CACHE_SERVICE',
      useClass: RedisCacheService,
    },
  ],
  exports: ['CACHE_SERVICE'],
})
export class CacheModule {}
