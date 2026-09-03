import { AccountRepository } from '../../domain/repository/account-repository.interface';
import { CacheService } from '../../domain/cache/cache-service.interface'; // 🌟 Adicione o import do contrato do Redis

export class LiquidatePaymentUseCase {
  constructor(
    private readonly accountRepository: AccountRepository,
    private readonly cacheService: CacheService, 
  ) {}

  async execute(paymentData: any) {
    console.log('[PixScale] [UseCase] Iniciando liquidação física do Pix...');
    
    const { destination_account_number, amount, idempotency_key } = paymentData;
    const origin_account_number = paymentData.origin_account_number || '123456-7';

    console.log(`[PixScale] [UseCase] 🛡️ Verificando chave de idempotência no Redis: ${idempotency_key}`);

    // 1. CHECAGEM: Verifica se o Pix já foi processado antes
    const cachedStatus = await this.cacheService.get(idempotency_key);

    if (cachedStatus) {
      console.warn(`[PixScale] [UseCase] [ALERT] Transação duplicada barrada pelo Redis! Status atual: ${cachedStatus}`);
      return { success: false, reason: 'DUPLICATE_TRANSACTION' };
    }

    // 2. TRAVA AGRESSIVA (30s): Bloqueia cliques simultâneos rápidos por lentidão de rede
    await this.cacheService.set(idempotency_key, 'PROCESSING', 30);
    console.log('[PixScale] [UseCase] Chave travada como PROCESSING no Redis. Chamando o Postgres...');

    // 3. TRANSAÇÃO ACID: Roda o SQL parametrizado de débito e crédito no Postgres
    const success = await this.accountRepository.executeLiquidation(
      origin_account_number,
      destination_account_number,
      amount,
      idempotency_key,
    );

    if (success) {
      // 4. SUCESSO (300s): Altera o status para COMPLETED permanentemente por 5 minutos
      await this.cacheService.set(idempotency_key, 'COMPLETED', 300);
      console.log(`[PixScale] [UseCase] Pix de R$ ${amount} liquidado com SUCESSO e salvo no Postgres e Redis!`);
      return { success: true };
    } else {
      // 5. FALHA (60s): Se o banco recusar (ex: saldo insuficiente), libera a trava rápido para o usuário tentar de novo corrigido
      await this.cacheService.set(idempotency_key, 'FAILED', 60);
      console.log('[PixScale] [UseCase] Falha crítica na liquidação do Pix no Postgres. Status: FAILED no Redis.');
      return { success: false, reason: 'POSTGRES_TRANSACTION_FAILED' };
    }
  }
}
