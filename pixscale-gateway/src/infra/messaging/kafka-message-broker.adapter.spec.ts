import { KafkaMessageBrokerAdapter } from './kafka-message-broker.adapter';

const lastValueFromMock = jest.fn();

jest.mock('rxjs', () => ({
  lastValueFrom: (...args: unknown[]) => lastValueFromMock(...args),
}));

describe('KafkaMessageBrokerAdapter', () => {
  it('connects the Kafka client on module initialization', async () => {
    const kafkaClient = { connect: jest.fn().mockResolvedValue(undefined) } as any;
    const adapter = new KafkaMessageBrokerAdapter(kafkaClient);

    await adapter.onModuleInit();

    expect(kafkaClient.connect).toHaveBeenCalledTimes(1);
  });

  it('emits a message and waits for its observable result', async () => {
    const message = { key: 'payment-key', value: { amount: 10 } };
    const observable = {};
    const kafkaClient = {
      emit: jest.fn().mockReturnValue(observable),
    } as any;
    lastValueFromMock.mockResolvedValueOnce(undefined);
    const adapter = new KafkaMessageBrokerAdapter(kafkaClient);

    await adapter.publish('pix-transactions', message.key, message.value);

    expect(kafkaClient.emit).toHaveBeenCalledWith('pix-transactions', message);
    expect(lastValueFromMock).toHaveBeenCalledWith(observable);
  });
});
