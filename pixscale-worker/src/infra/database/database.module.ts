import { Module } from '@nestjs/common';
import { PostgresAccountRepository } from './postgres/postgres-account.repository';

@Module({
  providers: [
    {
      provide: 'ACCOUNT_REPOSITORY',
      useClass: PostgresAccountRepository,
    },
  ],
  exports: ['ACCOUNT_REPOSITORY'],
})
export class DatabaseModule {}
