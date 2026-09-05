import { KafkaMessageBrokerAdapter } from './kafka-message-broker.adapter';

const lastValueFromMock = jest.fn();

jest.mock('rxjs', () => ({
  lastValueFrom: (...args: unknown[]) => lastValueFromMock(...args),
}));

describe('KafkaMessageBrokerAdapter', () => {
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
