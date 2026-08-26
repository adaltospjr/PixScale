import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  // Inicializa o NestJS estritamente como um Microservice (Consumer) do Kafka
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    transport: Transport.KAFKA,
    options: {
      client: {
        clientId: 'worker-liquidacao-consumer',
        brokers: ['localhost:9092'],
      },
      consumer: {
        groupId: 'pix-liquidation-group',
        allowAutoTopicCreation: true,
      },
    },
  });

  await app.listen();
  console.log('[PixScale] [Worker] Motor de Liquidação iniciado e escutando o Kafka!');
}
bootstrap();
