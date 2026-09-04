import { Module } from '@nestjs/common';
import { PostgresLimitsRepository } from './postgres/postgres-limits.repository';

@Module({
  providers: [
    // Inversão de Dependência: Amarra o Token da Interface à classe real do Postgres
    {
      provide: 'ACCOUNT_LIMITS_REPOSITORY',
      useClass: PostgresLimitsRepository,
    },
  ],
  // Exportamos o Token para que o AppModule e os Controllers consigam enxergar
  exports: ['ACCOUNT_LIMITS_REPOSITORY'],
})
export class DatabaseModule {}
