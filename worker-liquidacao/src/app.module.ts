import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PaymentEventsController } from './infra/messaging/controllers/payment-events.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../.env',
    }),
  ],
  controllers: [PaymentEventsController],
  providers: [],
})
export class AppModule {}
