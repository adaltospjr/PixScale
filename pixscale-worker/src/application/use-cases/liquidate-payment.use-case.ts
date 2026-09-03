import { AccountRepository } from '../../domain/repository/account-repository.interface';

export class LiquidatePaymentUseCase {
  constructor(
    // O Caso de Uso agora exige o contrato do banco para trabalhar
    private readonly accountRepository: AccountRepository,
  ) {}

  async execute(paymentData: any) {
    console.log('[PixScale] [UseCase] Iniciando liquidação física do Pix...');
    
    const { origin_account_number, destination_account_number, amount, idempotency_key } = paymentData;

    // Dispara a nossa transação ACID parametrizada e segura
    const success = await this.accountRepository.executeLiquidation(
      origin_account_number || '123456-7', // Fallback temporário caso mude o payload
      destination_account_number,
      amount,
      idempotency_key,
    );

    if (success) {
      console.log(`[PixScale] [UseCase] Pix de R$ ${amount} liquidado com SUCESSO e salvo no Postgres!`);
    } else {
      console.log('[PixScale] [UseCase] Falha crítica na liquidação do Pix no Postgres.');
    }
  }
}
