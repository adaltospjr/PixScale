import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Pool } from 'pg';
import { AccountLimitsRepository } from '../../../domain/repository/account-limits-repository.interface';

@Injectable()
export class PostgresLimitsRepository implements AccountLimitsRepository, OnModuleInit, OnModuleDestroy {
  private pool!: Pool;

  async onModuleInit() {
    this.pool = new Pool({
      user: process.env.POSTGRES_USER || 'adalto',
      host: 'localhost',
      database: process.env.POSTGRES_DB || 'pixscale_db',
      password: process.env.POSTGRES_PASSWORD || 'local_password123',
      port: Number(process.env.POSTGRES_PORT) || 5432,
      max: 10,
    });

    console.log('[PixScale] [Limits API] Pool de conexões com o PostgreSQL ativo!');
  }

  async onModuleDestroy() {
    await this.pool.end();
  }

  async findDailyLimitAndBalance(numberAccount: string): Promise<{ balance: number; dailyLimit: number } | null> {

    const query = 'SELECT balance, daily_limit FROM accounts WHERE number_account = $1';
    const result = await this.pool.query(query, [numberAccount]);

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];

    return {
      balance: Number(row.balance),
      dailyLimit: Number(row.daily_limit),
    };
  }
}
