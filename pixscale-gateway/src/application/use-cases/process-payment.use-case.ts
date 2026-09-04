import { MessagingBroker } from '../../domain/messaging/messaging-broker.interface'; 
import type { TransactionLimitChecker } from '../ports/transaction-limit-checker.interface';

export interface ProcessPaymentInput {
  idempotency_key: string;
  destination_account_number: string;
  amount: number;
  device_fingerprint: string;
}

export class ProcessPaymentUseCase {
  constructor(
    private readonly messageBroker: MessagingBroker,
    private readonly limitChecker: TransactionLimitChecker,
  ) {}

  async execute(createPaymentDto: ProcessPaymentInput) {
    console.log('[PixScale] [UseCase] Iniciando orquestração. Consultando saldo e limites de forma síncrona...');

    const originAccount = '123456-7';  

    try {
      const { allowed, reason } = await this.limitChecker.validate(
        originAccount,
        createPaymentDto.amount,
      );

      if (!allowed) {
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

    } catch (error: any) {
      console.error('[PixScale] [UseCase] Erro crítico de comunicação com a API de limites:', error.message);
      throw new Error('Serviço de validação temporariamente indisponível.');
    }
  }
}
