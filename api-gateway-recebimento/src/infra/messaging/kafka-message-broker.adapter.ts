import { Injectable, Inject, OnModuleInit } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { MessagingBroker } from '../../domain/messaging/messaging-broker.interface';

@Injectable()
export class KafkaMessageBrokerAdapter implements MessagingBroker, OnModuleInit {
  constructor(
    @Inject('KAFKA_SERVICE')
    private readonly kafkaClient: ClientKafka,
  ) {}

  async onModuleInit() {
    // this.kafkaClient.subscribeToResponseOf('pix-transactions');
    await this.kafkaClient.connect();
    console.log('[PixScale] [Infra] Adapter do Kafka conectado ao cluster com sucesso!');
  }

  async publish(topic: string, key: string, payload: any): Promise<void> {
    console.log(`[PixScale] [Infra] Publicando de forma técnica no Kafka no tópico: ${topic}`);
    this.kafkaClient.emit(topic, { key, value: payload });
  }
}
