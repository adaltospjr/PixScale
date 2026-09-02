import { Injectable, Inject, OnModuleInit } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import { MessagingBroker } from '../../domain/messaging/messaging-broker.interface';

@Injectable()
export class KafkaMessageBrokerAdapter
  implements MessagingBroker, OnModuleInit
{
  private readonly kafkaClient: ClientKafka;

  constructor(@Inject('KAFKA_SERVICE') kafkaClient: ClientKafka) {
    this.kafkaClient = kafkaClient;
  }

  async onModuleInit() {
    // this.kafkaClient.subscribeToResponseOf('pix-transactions');
    await this.kafkaClient.connect();
    console.log(
      '[PixScale] [Infra] Adapter do Kafka conectado ao cluster com sucesso!',
    );
  }

  async publish(topic: string, key: string, payload: any): Promise<void> {
    console.log(
      `[PixScale] [Infra] Publicando de forma técnica no Kafka no tópico: ${topic}`,
    );
    await lastValueFrom(this.kafkaClient.emit(topic, { key, value: payload }));
  }
}
