import { CircuitBreaker, CircuitOpenError } from './circuit-breaker';

describe('CircuitBreaker', () => {
  it('opens after the failure threshold and allows a half-open probe after cooldown', async () => {
    jest.useFakeTimers();
    const breaker = new CircuitBreaker(2, 1000);
    const failure = jest.fn().mockRejectedValue(new Error('down'));

    await expect(breaker.execute(failure)).rejects.toThrow('down');
    await expect(breaker.execute(failure)).rejects.toThrow('down');
    await expect(breaker.execute(failure)).rejects.toThrow(CircuitOpenError);

    jest.advanceTimersByTime(1001);
    const success = jest.fn().mockResolvedValue('ok');
    await expect(breaker.execute(success)).resolves.toBe('ok');
    jest.useRealTimers();
  });
});
