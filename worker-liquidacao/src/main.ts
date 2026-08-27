import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const kafkaPort = process.env.KAFKA_PORT || '9092';

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    transport: Transport.KAFKA,
    options: {
      client: {
        clientId: 'worker-liquidacao-consumer',
        brokers: [`localhost:${kafkaPort}`],
      },
      consumer: {
        groupId: 'pix-liquidation-group',
        allowAutoTopicCreation: true,
      },
      subscribe: {
        fromBeginning: true,
      },
    },
  });

  await app.listen();
  console.log(`[PixScale] [Worker] Motor de Liquidação iniciado e escutando o Kafka na porta: ${kafkaPort}`);
}
bootstrap();
