import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { PaymentEventsController } from './infra/messaging/controllers/payment-events.controller';
import { DatabaseModule } from './infra/database/database.module';
import { CacheModule } from './infra/cache/cache.module';

import { LiquidatePaymentUseCase } from './application/use-cases/liquidate-payment.use-case';

import type { AccountRepository } from './domain/repository/account-repository.interface';

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

      useFactory: (accountRepository: AccountRepository) =>
        new LiquidatePaymentUseCase(accountRepository),

      inject: ['ACCOUNT_REPOSITORY'],
    },
  ],
})
export class AppModule {}