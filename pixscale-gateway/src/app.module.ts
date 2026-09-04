import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios'; // 🌟 Importe o módulo HTTP oficial
import { PaymentsController } from './infra/http/controllers/payments.controller';
import { KafkaModule } from './infra/messaging/kafka.module';
import { KafkaMessageBrokerAdapter } from './infra/messaging/kafka-message-broker.adapter';
import { ProcessPaymentUseCase } from './application/use-cases/process-payment.use-case';
import { LimitsApiHttpAdapter } from './infra/http/clients/limits-api-http.adapter';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../.env',
    }),
    HttpModule,
    KafkaModule,
  ],
  controllers: [PaymentsController],
  providers: [
    LimitsApiHttpAdapter,
    {
      provide: 'TRANSACTION_LIMIT_CHECKER',
      useExisting: LimitsApiHttpAdapter,
    },
    {
      provide: ProcessPaymentUseCase,
      useFactory: (
        messageBroker: KafkaMessageBrokerAdapter,
        limitChecker: LimitsApiHttpAdapter,
      ) => new ProcessPaymentUseCase(messageBroker, limitChecker),
      inject: [KafkaMessageBrokerAdapter, 'TRANSACTION_LIMIT_CHECKER'],
    },
  ],
})
export class AppModule {}
