import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const kafkaBrokers = (process.env.KAFKA_BROKERS || `localhost:${process.env.KAFKA_PORT || '9092'}`).split(',');

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    transport: Transport.KAFKA,
    options: {
      client: {
        clientId: 'pixscale-worker-consumer',
        brokers: kafkaBrokers,
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
  console.log(`[PixScale] [Worker] Motor de Liquidação iniciado e escutando o Kafka em: ${kafkaBrokers.join(', ')}`);
}
bootstrap().catch((error) => {
  console.error('[PixScale] [Worker] Falha fatal ao iniciar:', error);
  process.exitCode = 1;
});
