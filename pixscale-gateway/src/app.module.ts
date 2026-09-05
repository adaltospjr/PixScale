import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios'; // 🌟 Importe o módulo HTTP oficial
import { PaymentsController } from './infra/http/controllers/payments.controller';
import { KafkaModule } from './infra/messaging/kafka.module';
import { KafkaMessageBrokerAdapter } from './infra/messaging/kafka-message-broker.adapter';
import { ProcessPaymentUseCase } from './application/use-cases/process-payment.use-case';
import { LimitsApiHttpAdapter } from './infra/http/clients/limits-api-http.adapter';
import { PostgresPaymentIdempotencyRepository } from './infra/database/postgres/postgres-payment-idempotency.repository';
import { HealthController } from './infra/health/health.controller';
import { StructuredLogger } from './infra/observability/structured-logger';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../.env',
    }),
    HttpModule.register({ timeout: 5000, maxRedirects: 0 }),
    KafkaModule,
  ],
  controllers: [PaymentsController, HealthController],
  providers: [
    LimitsApiHttpAdapter,
    PostgresPaymentIdempotencyRepository,
    StructuredLogger,
    {
      provide: 'PAYMENT_IDEMPOTENCY_REPOSITORY',
      useExisting: PostgresPaymentIdempotencyRepository,
    },
    {
      provide: 'TRANSACTION_LIMIT_CHECKER',
      useExisting: LimitsApiHttpAdapter,
    },
    {
      provide: ProcessPaymentUseCase,
      useFactory: (
        messageBroker: KafkaMessageBrokerAdapter,
        limitChecker: LimitsApiHttpAdapter,
        idempotencyRepository: PostgresPaymentIdempotencyRepository,
      ) => new ProcessPaymentUseCase(messageBroker, limitChecker, idempotencyRepository),
      inject: [KafkaMessageBrokerAdapter, 'TRANSACTION_LIMIT_CHECKER', 'PAYMENT_IDEMPOTENCY_REPOSITORY'],
    },
  ],
})
export class AppModule {}
