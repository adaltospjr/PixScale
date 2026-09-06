import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Pool } from 'pg';
import { ConfigService } from '@nestjs/config';
import { AccountFinancialProfile, AccountLimitsRepository } from '../../../domain/repository/account-limits-repository.interface';

@Injectable()
export class PostgresLimitsRepository implements AccountLimitsRepository, OnModuleInit, OnModuleDestroy {
  private pool!: Pool;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    this.pool = new Pool({
      user: this.configService.get<string>('POSTGRES_USER') || 'adalto',
      host: this.configService.get<string>('POSTGRES_HOST') || 'localhost',
      database: this.configService.get<string>('POSTGRES_DB') || 'pixscale_db',
      password: this.configService.get<string>('POSTGRES_PASSWORD') || 'local_password123',
      port: this.configService.get<number>('POSTGRES_PORT') || 5432,
      max: 10,
    });

    console.log('[PixScale] [Limits API] Pool de conexões com o PostgreSQL ativo!');
  }

  async onModuleDestroy() {
    await this.pool.end();
  }

  async findDailyLimitAndBalance(numberAccount: string): Promise<AccountFinancialProfile | null> {

    const query = `
      SELECT
        a.balance,
        a.daily_limit,
        COALESCE(SUM(t.amount) FILTER (WHERE t.status = 'APPROVED' AND t.created_at >= CURRENT_DATE), 0) AS daily_spent
      FROM accounts a
      LEFT JOIN transactions t ON t.origin_account_id = a.id
      WHERE a.number_account = $1
      GROUP BY a.id, a.balance, a.daily_limit
    `;
    const result = await this.pool.query(query, [numberAccount]);

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];

    return {
      balance: Number(row.balance),
      dailyLimit: Number(row.daily_limit),
      dailySpent: Number(row.daily_spent),
    };
  }

  async ping(): Promise<void> {
    await this.pool.query('SELECT 1');
  }
}
