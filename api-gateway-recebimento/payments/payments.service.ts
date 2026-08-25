import { Injectable, Inject, OnModuleInit } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { CreatePaymentDto } from './dtos/create-payment.dto';

@Injectable()
export class PaymentsService implements OnModuleInit {
    constructor(
        @Inject('KAFKA_SERVICE')
        private readonly kafkaClient: ClientKafka,
    ) {}

    // O ciclo de vida de conexão com o cluster fica isolado na camada de service
    async onModuleInit() {
        this.kafkaClient.subscribeToResponseOf('pix-transactions');
        await this.kafkaClient.connect();
        console.log('[PixScale] Canal do Producer conectado ao Apache Kafka com sucesso!');
    }

    async processPayment(createPaymentDto: CreatePaymentDto){
        console.log('[PixScale] [Service Publicando evento no tópico do Kafka...]')

        this.kafkaClient.emit('pix-transactions', {
            key: createPaymentDto.idempotency_key,
            value: createPaymentDto,
        });

        return {
            message: 'Payment received successfully and sent to processing queue.',
            idempotency_key: createPaymentDto.idempotency_key,
            status: 'PROCESSING'
        };
    }
}
