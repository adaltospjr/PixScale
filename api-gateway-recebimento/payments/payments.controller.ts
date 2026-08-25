import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common'
import { CreatePaymentDto } from './dtos/create-payment.dto'
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
    constructor(
        private readonly paymentsService: PaymentsService,
    ) { }

    @Post()
    @HttpCode(HttpStatus.ACCEPTED) // Status 202 (Accepted) do padrão Fire & Forget
    async receivePayment(@Body() createPaymentDto: CreatePaymentDto) {
        console.log('[PixScale] [Controller] Payload HTTP validado. Repassando para o Service...');

        // Apenas delega a execução para o Service
        return await this.paymentsService.processPayment(createPaymentDto);
    }
}
