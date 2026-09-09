import { AccountRepository } from '../../domain/repository/account-repository.interface';
import { PaymentInput, LiquidationResult } from '../dto/payment-input';

export class LiquidatePaymentUseCase {
  constructor(
    private readonly accountRepository: AccountRepository,
  ) {}

  async execute(paymentData: PaymentInput): Promise<LiquidationResult> {
    console.log(
      '[PixScale] [UseCase] Iniciando liquidação física do Pix...',
    );

    const {
      origin_account_number,
      destination_account_number,
      amount,
      idempotency_key,
    } = paymentData;

    const result = await this.accountRepository.executeLiquidation(
      origin_account_number,
      destination_account_number,
      amount,
      idempotency_key,
    );

    if (result.status === 'DUPLICATE') {
      console.warn(
        `[PixScale] [UseCase] Transação duplicada identificada pelo PostgreSQL. Idempotency Key: ${idempotency_key}`,
      );

      return {
        success: false,
        reason: 'DUPLICATE_TRANSACTION',
      };
    }

    console.log(
      `[PixScale] [UseCase] Pix de R$ ${amount} liquidado com SUCESSO. Transaction ID: ${result.transactionId}`,
    );

    return {
      success: true,
    };
  }
}