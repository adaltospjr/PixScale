import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import type { IdempotencyClaim, PaymentIdempotencyRepository } from '../../../application/ports/payment-idempotency.repository.interface';

@Injectable()
export class PostgresPaymentIdempotencyRepository implements PaymentIdempotencyRepository, OnModuleInit, OnModuleDestroy {
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
  }

  async onModuleDestroy() {
    await this.pool.end();
  }

  async claim(key: string, requestHash: string): Promise<IdempotencyClaim> {
    const inserted = await this.pool.query(
      `INSERT INTO gateway_idempotency_keys (idempotency_key, request_hash)
       VALUES ($1, $2)
       ON CONFLICT (idempotency_key) DO NOTHING
       RETURNING idempotency_key`,
      [key, requestHash],
    );

    if (inserted.rowCount === 1) {
      return 'CLAIMED';
    }

    const existing = await this.pool.query(
      'SELECT request_hash FROM gateway_idempotency_keys WHERE idempotency_key = $1',
      [key],
    );

    return existing.rows[0]?.request_hash === requestHash ? 'DUPLICATE' : 'CONFLICT';
  }

  async release(key: string): Promise<void> {
    await this.pool.query('DELETE FROM gateway_idempotency_keys WHERE idempotency_key = $1', [key]);
  }
}
