import { BadRequestException, Body, Controller, HttpCode, HttpStatus, Post, ServiceUnavailableException, UseGuards } from '@nestjs/common';
import { CreatePaymentDto } from '../dtos/create-payment.dto';
import { ProcessPaymentUseCase } from '../../../application/use-cases/process-payment.use-case';
import { ServiceUnavailableError } from '../../../application/errors/service-unavailable.error';
import { JwtGuard } from '../guards/jwt.guard';
import { StructuredLogger } from '../../observability/structured-logger';

@Controller('payments')
@UseGuards(JwtGuard)
export class PaymentsController {
  constructor(
    private readonly processPaymentUseCase: ProcessPaymentUseCase,
    private readonly logger: StructuredLogger,
  ) {}

  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  async receivePayment(@Body() createPaymentDto: CreatePaymentDto) {
    this.logger.log('payment.request.received', { account: createPaymentDto.origin_account_number });
    try {
      const result = await this.processPaymentUseCase.execute(createPaymentDto);

      if (result.status === 'REJECTED') {
        throw new BadRequestException({
          message: 'Pix negado por regras de negócio.',
          reason: result.reason,
        });
      }

      return result;
    } catch (error) {
      if (error instanceof ServiceUnavailableError) {
        throw new ServiceUnavailableException(error.message);
      }
      throw error;
    }
  }
}
