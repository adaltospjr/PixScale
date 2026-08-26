export interface MessagingBroker {
  publish(topic: string, key: string, payload: any): Promise<void>;
}
