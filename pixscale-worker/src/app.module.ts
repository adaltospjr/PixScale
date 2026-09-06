import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PaymentEventsController } from './infra/messaging/controllers/payment-events.controller';
import { DatabaseModule } from './infra/database/database.module'; // 🌟 Importe o novo módulo de banco
import { CacheModule } from './infra/cache/cache.module';
import { LiquidatePaymentUseCase } from './application/use-cases/liquidate-payment.use-case';
import type { AccountRepository } from './domain/repository/account-repository.interface';
import type { CacheService } from './domain/cache/cache-service.interface';
import { HealthController } from './infra/health/health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../.env',
    }),
    DatabaseModule,
    CacheModule,
  ],
  controllers: [PaymentEventsController, HealthController],
  providers: [
    {
      provide: LiquidatePaymentUseCase,
      useFactory: (accountRepository: AccountRepository, cacheService: CacheService) =>
        new LiquidatePaymentUseCase(accountRepository, cacheService),
      inject: ['ACCOUNT_REPOSITORY', 'CACHE_SERVICE'],
    },
  ],
})
export class AppModule {}
