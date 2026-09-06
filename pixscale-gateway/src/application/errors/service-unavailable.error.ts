export class ServiceUnavailableError extends Error {
  constructor(service: string) {
    super(`${service} is temporarily unavailable.`);
    this.name = 'ServiceUnavailableError';
  }
}
