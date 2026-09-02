import { CreatePaymentDto } from '../../infra/http/dtos/create-payment.dto';
import { MessagingBroker } from '../../domain/messaging/messaging-broker.interface';

export class ProcessPaymentUseCase {
  constructor(private readonly messageBroker: MessagingBroker) {}

  async execute(createPaymentDto: CreatePaymentDto) {
    console.log(
      '[PixScale] [UseCase] Orquestrando lógica de negócio do pagamento...',
    );

    await this.messageBroker.publish(
      'pix-transactions',
      createPaymentDto.idempotency_key,
      createPaymentDto,
    );

    return {
      message: 'Payment received successfully and sent to processing queue.',
      idempotency_key: createPaymentDto.idempotency_key,
      status: 'PROCESSING',
    };
  }
}
