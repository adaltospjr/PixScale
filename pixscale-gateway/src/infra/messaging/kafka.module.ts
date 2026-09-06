import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { KafkaMessageBrokerAdapter } from './kafka-message-broker.adapter';

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: 'KAFKA_SERVICE',
        imports: [ConfigModule],
        useFactory: async (configService: ConfigService) => {
          const brokers = (
            configService.get<string>('KAFKA_BROKERS') ||
            `localhost:${configService.get<string>('KAFKA_PORT') || '9092'}`
          ).split(',');
          return {
            transport: Transport.KAFKA,
            options: {
              client: {
                clientId: 'pixscale-gateway',
                brokers,
              },
              consumer: {
                groupId: 'pix-gateway-consumer',
              },
              producerOnlyMode: true,
            },
          };
        },
        inject: [ConfigService],
      },
    ]),
  ],
  providers: [KafkaMessageBrokerAdapter],
  exports: [ClientsModule, KafkaMessageBrokerAdapter],
})
export class KafkaModule {}
