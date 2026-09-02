import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { CreatePaymentDto } from '../dtos/create-payment.dto';
import { ProcessPaymentUseCase } from '../../../application/use-cases/process-payment.use-case';
import { KafkaMessageBrokerAdapter } from '../../messaging/kafka-message-broker.adapter';

@Controller('payments')
export class PaymentsController {
  private readonly processPaymentUseCase: ProcessPaymentUseCase;
  private readonly kafkaAdapter: KafkaMessageBrokerAdapter;

  constructor(kafkaAdapter: KafkaMessageBrokerAdapter) {
    this.kafkaAdapter = kafkaAdapter;
    this.processPaymentUseCase = new ProcessPaymentUseCase(this.kafkaAdapter);
  }

  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  async receivePayment(@Body() createPaymentDto: CreatePaymentDto) {
    console.log(
      '[PixScale] [Controller] Requisição recebida no endpoint HTTP.',
    );
    return await this.processPaymentUseCase.execute(createPaymentDto);
  }
}
