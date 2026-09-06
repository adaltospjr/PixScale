import { StructuredLogger } from './structured-logger';

describe('StructuredLogger', () => {
  it('writes structured log data', () => {
    const logger = new StructuredLogger();
    const spy = jest.spyOn((logger as any).logger, 'log').mockImplementation();

    logger.log('payment.received', { requestId: 'req-1' });

    expect(spy).toHaveBeenCalledWith(JSON.stringify({ event: 'payment.received', requestId: 'req-1' }));
  });

  it('writes structured error data', () => {
    const logger = new StructuredLogger();
    const spy = jest.spyOn((logger as any).logger, 'error').mockImplementation();

    logger.error('payment.failed', new Error('down'), { requestId: 'req-1' });

    expect(spy).toHaveBeenCalledWith(JSON.stringify({ event: 'payment.failed', error: 'down', requestId: 'req-1' }));
  });
});
