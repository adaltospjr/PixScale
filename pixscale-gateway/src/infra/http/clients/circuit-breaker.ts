export class CircuitOpenError extends Error {
  constructor() {
    super('Limits API circuit breaker is open.');
    this.name = 'CircuitOpenError';
  }
}

export class CircuitBreaker {
  private failures = 0;
  private openedAt = 0;
  private halfOpenInFlight = false;

  constructor(
    private readonly failureThreshold: number,
    private readonly cooldownMs: number,
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.isOpen()) {
      if (Date.now() - this.openedAt < this.cooldownMs || this.halfOpenInFlight) {
        throw new CircuitOpenError();
      }
      this.halfOpenInFlight = true;
    }

    try {
      const result = await operation();
      this.failures = 0;
      this.openedAt = 0;
      return result;
    } catch (error) {
      this.failures += 1;
      if (this.failures >= this.failureThreshold) {
        this.openedAt = Date.now();
      }
      throw error;
    } finally {
      this.halfOpenInFlight = false;
    }
  }

  private isOpen() {
    return this.openedAt > 0;
  }
}
