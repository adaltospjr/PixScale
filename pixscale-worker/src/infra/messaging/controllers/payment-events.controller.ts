import { Controller } from '@nestjs/common';
import { EventPattern, Payload, Ctx, KafkaContext } from '@nestjs/microservices'; // <-- Adicione Ctx e KafkaContext
import { LiquidatePaymentUseCase } from '../../../application/use-cases/liquidate-payment.use-case';

@Controller()
export class PaymentEventsController {
  private readonly liquidatePaymentUseCase: LiquidatePaymentUseCase;

  constructor() {
    this.liquidatePaymentUseCase = new LiquidatePaymentUseCase();
  }

  @EventPattern('pix-transactions')
  async handlePixTransaction(@Payload() data: any, @Ctx() context: KafkaContext) {
    console.log('[PixScale] [Infra] Novo evento capturado no tópico do Kafka!');
    
    // Captura a mensagem bruta do KafkaJS diretamente do contexto de rede
    const originalMessage = context.getMessage();
    
    // 🛡️ Validação Defensiva contra mensagens nulas
    if (!originalMessage || !originalMessage.value) {
      console.log('[PixScale] [Infra] Mensagem vazia ou inválida ignorada.');
      return;
    }
    
    const rawValue = originalMessage.value;
    const paymentData = Buffer.isBuffer(rawValue)
      ? JSON.parse(rawValue.toString())
      : typeof rawValue === 'string'
        ? JSON.parse(rawValue)
        : rawValue;
    
    // Executa o coração da Clean Architecture
    await this.liquidatePaymentUseCase.execute(paymentData);
  }

}
