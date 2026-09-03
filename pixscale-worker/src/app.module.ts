import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PaymentEventsController } from './infra/messaging/controllers/payment-events.controller';
import { DatabaseModule } from './infra/database/database.module'; // 🌟 Importe o novo módulo de banco
import { CacheModule } from './infra/cache/cache.module';
CacheModule

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../.env',
    }),
    DatabaseModule,
    CacheModule,
  ],
  controllers: [PaymentEventsController],
  providers: [],
})
export class AppModule {}
