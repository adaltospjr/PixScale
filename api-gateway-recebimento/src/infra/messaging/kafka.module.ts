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
          const kafkaPort = configService.get<string>('KAFKA_PORT') || '9092';
          return {
            transport: Transport.KAFKA,
            options: {
              client: {
                clientId: 'api-gateway-recebimento',
                brokers: [`localhost:${kafkaPort}`],
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
