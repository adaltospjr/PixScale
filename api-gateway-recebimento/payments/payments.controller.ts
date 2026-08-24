import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common'
import { CreatePaymentDto } from './dtos/create-payment.dto'

@Controller('payments')
export class PaymentsController {

    @Post()
    @HttpCode(HttpStatus.ACCEPTED)
    async receivePayment(@Body() CreatePaymentDto: CreatePaymentDto) {
        // Log temporário
        console.log('[PixScale] Payload recebido e validado com sucesso:', CreatePaymentDto);

        return {
            message: 'Payment received successfully and is being processed.',
            idempotency_key: CreatePaymentDto.idempotency_key,
            status: 'PROCESSING'
        }
    }
}
