import { Controller } from '@nestjs/common';
import { EventPattern, Payload, Ctx, KafkaContext } from '@nestjs/microservices';
import { LiquidatePaymentUseCase } from '../../../application/use-cases/liquidate-payment.use-case';

@Controller()
export class PaymentEventsController {
  constructor(private readonly liquidatePaymentUseCase: LiquidatePaymentUseCase) {}

  @EventPattern('pix-transactions')
  async handlePixTransaction(@Payload() data: unknown, @Ctx() _context: KafkaContext) {
    console.log('[PixScale] [Infra] Novo evento capturado no tópico do Kafka!');

    const paymentData = Buffer.isBuffer(data)
      ? JSON.parse(data.toString())
      : typeof data === 'string'
        ? JSON.parse(data)
        : data;

    if (!paymentData || typeof paymentData !== 'object') {
      throw new Error('Invalid payment event payload.');
    }

    console.log('[PixScale] [Infra] Payload recebido:', paymentData);
    await this.liquidatePaymentUseCase.execute(paymentData);
  }
}
