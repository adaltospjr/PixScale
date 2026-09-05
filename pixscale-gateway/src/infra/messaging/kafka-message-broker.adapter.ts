import { Injectable, Inject } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import { MessagingBroker } from '../../domain/messaging/messaging-broker.interface';

@Injectable()
export class KafkaMessageBrokerAdapter
  implements MessagingBroker
{
  private readonly kafkaClient: ClientKafka;

  constructor(@Inject('KAFKA_SERVICE') kafkaClient: ClientKafka) {
    this.kafkaClient = kafkaClient;
  }

  async publish(topic: string, key: string, payload: any): Promise<void> {
    console.log(
      `[PixScale] [Infra] Publicando de forma técnica no Kafka no tópico: ${topic}`,
    );
    await lastValueFrom(this.kafkaClient.emit(topic, { key, value: payload }));
  }
}
