import { Controller, Inject } from '@nestjs/common';
import { EventPattern, Payload, Ctx, KafkaContext } from '@nestjs/microservices';
import { LiquidatePaymentUseCase } from '../../../application/use-cases/liquidate-payment.use-case';
import type { AccountRepository } from '../../../domain/repository/account-repository.interface';

@Controller()
export class PaymentEventsController {
  private liquidatePaymentUseCase!: LiquidatePaymentUseCase;

  constructor(
    // Injeta o repositório físico do Postgres usando o Token do Clean Arch
    @Inject('ACCOUNT_REPOSITORY')
    private readonly accountRepository: AccountRepository,
  ) {
    // Instancia o caso de uso passando o repositório injetado pelo NestJS
    this.liquidatePaymentUseCase = new LiquidatePaymentUseCase(this.accountRepository);
  }

  @EventPattern('pix-transactions')
  async handlePixTransaction(@Payload() data: any, @Ctx() context: KafkaContext) {
    console.log('[PixScale] [Infra] Novo evento capturado no tópico do Kafka!');

    const paymentData = Buffer.isBuffer(data)
      ? JSON.parse(data.toString())
      : typeof data === 'string'
        ? JSON.parse(data)
        : data;

    console.log('[PixScale] [Infra] Payload recebido:', paymentData);
    await this.liquidatePaymentUseCase.execute(paymentData);
  }
}
