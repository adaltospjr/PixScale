import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PaymentsController } from './infra/http/controllers/payments.controller';
import { KafkaModule } from './infra/messaging/kafka.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../.env',
    }),
    KafkaModule,
  ],
  controllers: [PaymentsController],
  providers: [],
})
export class AppModule {}
