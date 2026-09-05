import { MessagingBroker } from '../../domain/messaging/messaging-broker.interface'; 
import type { TransactionLimitChecker } from '../ports/transaction-limit-checker.interface';
import { ServiceUnavailableError } from '../errors/service-unavailable.error';
import { createHash } from 'node:crypto';
import type { PaymentIdempotencyRepository } from '../ports/payment-idempotency.repository.interface';

export interface ProcessPaymentInput {
  idempotency_key: string;
  origin_account_number: string;
  destination_account_number: string;
  amount: number;
  device_fingerprint: string;
}

export class ProcessPaymentUseCase {
  constructor(
    private readonly messageBroker: MessagingBroker,
    private readonly limitChecker: TransactionLimitChecker,
    private readonly idempotencyRepository: PaymentIdempotencyRepository,
  ) {}

  async execute(createPaymentDto: ProcessPaymentInput) {
    console.log('[PixScale] [UseCase] Iniciando orquestração. Consultando saldo e limites de forma síncrona...');

    const originAccount = createPaymentDto.origin_account_number;
    let claimed = false;

    try {
      const requestHash = createHash('sha256').update(JSON.stringify(createPaymentDto)).digest('hex');
      const claim = await this.idempotencyRepository.claim(createPaymentDto.idempotency_key, requestHash);
      if (claim === 'DUPLICATE') return { status: 'PROCESSING', idempotency_key: createPaymentDto.idempotency_key };
      if (claim === 'CONFLICT') return { status: 'REJECTED', reason: 'IDEMPOTENCY_KEY_REUSED' };
      claimed = true;

      const { allowed, reason } = await this.limitChecker.validate(
        originAccount,
        createPaymentDto.amount,
      );

      if (!allowed) {
        await this.idempotencyRepository.release(createPaymentDto.idempotency_key);
        claimed = false;
        console.warn(`[PixScale] [UseCase] Transação NEGADA pela API de limites. Motivo: ${reason}`);
        return { status: 'REJECTED', reason };
      }

      console.log('[PixScale] [UseCase] API de Limites aprovou a transação! Seguindo para o Kafka...');

      await this.messageBroker.publish(
        'pix-transactions',
        createPaymentDto.idempotency_key,
        createPaymentDto
      );

      return {
        message: 'Payment received successfully and sent to processing queue.',
        idempotency_key: createPaymentDto.idempotency_key,
        status: 'PROCESSING',
      };

    } catch (error: unknown) {
      if (claimed) await this.idempotencyRepository.release(createPaymentDto.idempotency_key);
      const message = error instanceof Error ? error.message : 'unknown error';
      console.error('[PixScale] [UseCase] Falha no processamento do pagamento:', message);
      throw new ServiceUnavailableError('payment dependencies');
    }
  }
}
