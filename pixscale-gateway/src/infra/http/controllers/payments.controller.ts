import { BadRequestException, Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { CreatePaymentDto } from '../dtos/create-payment.dto';
import { ProcessPaymentUseCase } from '../../../application/use-cases/process-payment.use-case';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly processPaymentUseCase: ProcessPaymentUseCase) {}

  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  async receivePayment(@Body() createPaymentDto: CreatePaymentDto) {
    console.log('[PixScale] [Controller] Requisição recebida no endpoint HTTP do Gateway.');
    const result = await this.processPaymentUseCase.execute(createPaymentDto);

    if (result.status === 'REJECTED') {
      throw new BadRequestException({
        message: 'Pix negado por regras de negócio.',
        reason: result.reason,
      });
    }

    return result;
  }
}
