import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LimitsController } from './infra/http/controllers/limits.controller';
import { DatabaseModule } from './infra/database/database.module';
import { ValidateTransactionLimitUseCase } from './application/use-cases/validate-transaction-limit.use-case'; // 🌟 Importe o Caso de Uso
import { HealthController } from './infra/health/health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../.env',
    }),
    DatabaseModule, // Carrega o token 'ACCOUNT_LIMITS_REPOSITORY' necessário para o UseCase
  ],
  controllers: [LimitsController, HealthController],
  providers: [
    ValidateTransactionLimitUseCase, // 🌟 Registre o Caso de Uso como um Provider central
  ],
})
export class AppModule {}
