import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PaymentEventsController } from './infra/messaging/controllers/payment-events.controller';
import { DatabaseModule } from './infra/database/database.module'; // 🌟 Importe o novo módulo de banco

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../.env',
    }),
    DatabaseModule,
  ],
  controllers: [PaymentEventsController],
  providers: [],
})
export class AppModule {}
