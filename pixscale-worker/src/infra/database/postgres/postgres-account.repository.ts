import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Pool } from 'pg';
import { ConfigService } from '@nestjs/config';
import { AccountRepository } from '../../../domain/repository/account-repository.interface';

@Injectable()
export class PostgresAccountRepository
  implements AccountRepository, OnModuleInit, OnModuleDestroy
{
  private pool!: Pool;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    this.pool = new Pool({
      user: this.configService.get<string>('POSTGRES_USER') || 'adalto',
      host: this.configService.get<string>('POSTGRES_HOST') || 'localhost',
      database:
        this.configService.get<string>('POSTGRES_DB') || 'pixscale_db',
      password:
        this.configService.get<string>('POSTGRES_PASSWORD') ||
        'local_password123',
      port: this.configService.get<number>('POSTGRES_PORT') || 5432,
      max: 20,
      idleTimeoutMillis: 30000,
    });

    console.log(
      '[PixScale] [Infra] Pool de conexões com o PostgreSQL iniciado com sucesso!',
    );
  }

  async onModuleDestroy() {
    await this.pool.end();
  }

  async findAccountByNumber(
    accountNumber: string,
  ): Promise<{ id: string; balance: number } | null> {
    const query = 'SELECT * FROM accounts WHERE number_account = $1';
    const result = await this.pool.query(query, [accountNumber]);

    return result.rows[0]
      ? {
          id: result.rows[0].id,
          balance: Number(result.rows[0].balance),
        }
      : null;
  }

  async ping(): Promise<void> {
    await this.pool.query('SELECT 1');
  }

  async executeLiquidation(
    originAccount: string,
    destinationAccount: string,
    amount: number,
    idempotencyKey: string,
  ): Promise<{
    status: 'PROCESSED' | 'DUPLICATE';
    transactionId: string;
  }> {
    let client;

    try {
      client = await this.pool.connect();

      await client.query('BEGIN');

      /**
       * Primeiro registramos a transação.
       *
       * A coluna idempotency_key possui uma restrição UNIQUE.
       * O ON CONFLICT garante que apenas uma execução consiga
       * registrar a transação quando houver concorrência.
       */
      const transactionQuery = `
        INSERT INTO transactions (
          idempotency_key,
          origin_account_id,
          destination_account_id,
          amount,
          status
        )
        SELECT
          $1,
          origin.id,
          destination.id,
          $4,
          'PENDING'
        FROM accounts origin
        CROSS JOIN accounts destination
        WHERE origin.number_account = $2
          AND destination.number_account = $3
        ON CONFLICT (idempotency_key) DO NOTHING
        RETURNING id;
      `;

      const transactionResult = await client.query(transactionQuery, [
        idempotencyKey,
        originAccount,
        destinationAccount,
        amount,
      ]);

      /**
       * A idempotency_key já existe.
       * Portanto, essa mensagem já foi processada ou está sendo processada.
       */
      if (transactionResult.rowCount === 0) {
        const existingTransaction = await client.query(
          `
            SELECT id
            FROM transactions
            WHERE idempotency_key = $1
          `,
          [idempotencyKey],
        );

        if (existingTransaction.rowCount === 0) {
          throw new Error(
            'Não foi possível determinar o estado da transação.',
          );
        }

        await client.query('ROLLBACK');

        return {
          status: 'DUPLICATE',
          transactionId: existingTransaction.rows[0].id,
        };
      }

      const transactionId = transactionResult.rows[0].id;

      /**
       * Débito da conta de origem.
       */
      const debitQuery = `
        UPDATE accounts
        SET balance = balance - $1
        WHERE number_account = $2
          AND balance >= $1
        RETURNING id;
      `;

      const debitResult = await client.query(debitQuery, [
        amount,
        originAccount,
      ]);

      if (debitResult.rowCount === 0) {
        throw new Error(
          'Saldo insuficiente ou conta de origem inválida.',
        );
      }

      /**
       * Crédito da conta de destino.
       */
      const creditQuery = `
        UPDATE accounts
        SET balance = balance + $1
        WHERE number_account = $2
        RETURNING id;
      `;

      const creditResult = await client.query(creditQuery, [
        amount,
        destinationAccount,
      ]);

      if (creditResult.rowCount === 0) {
        throw new Error('Conta de destino não encontrada.');
      }

      /**
       * A movimentação financeira foi concluída.
       * Atualizamos o estado da transação para APPROVED.
       */
      await client.query(
        `
          UPDATE transactions
          SET status = 'APPROVED'
          WHERE id = $1
        `,
        [transactionId],
      );

      await client.query('COMMIT');

      return {
        status: 'PROCESSED',
        transactionId,
      };
    } catch (error: any) {
      if (client) {
        await client.query('ROLLBACK');
      }

      console.error(
        '[PixScale] [Infra] Falha na liquidação do Pix. Realizando ROLLBACK:',
        error.message,
      );

      throw error;
    } finally {
      client?.release();
    }
  }
}