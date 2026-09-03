import { LiquidatePaymentUseCase } from '../../../application/use-cases/liquidate-payment.use-case';
import { PaymentEventsController } from './payment-events.controller';

jest.mock('../../../application/use-cases/liquidate-payment.use-case');

const LiquidatePaymentUseCaseMock = LiquidatePaymentUseCase as jest.MockedClass<typeof LiquidatePaymentUseCase>;

describe('PaymentEventsController', () => {
  let execute: jest.Mock;
  let repository: { executeLiquidation: jest.Mock };
  let cache: { get: jest.Mock; set: jest.Mock };
  let controller: PaymentEventsController;

  beforeEach(() => {
    execute = jest.fn().mockResolvedValue(undefined);
    repository = { executeLiquidation: jest.fn() };
    cache = { get: jest.fn(), set: jest.fn() };
    LiquidatePaymentUseCaseMock.mockImplementation(
      () => ({ execute }) as unknown as LiquidatePaymentUseCase,
    );
    controller = new PaymentEventsController(repository as any, cache as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('forwards null payloads to the use case', async () => {
    await controller.handlePixTransaction(null, {} as any);

    expect(execute).toHaveBeenCalledWith(null);
  });

  it('parses Buffer message values', async () => {
    const payment = { amount: 10 };

    await controller.handlePixTransaction(Buffer.from(JSON.stringify(payment)), {} as any);

    expect(execute).toHaveBeenCalledWith(payment);
  });

  it('parses string message values', async () => {
    const payment = { amount: 20 };

    await controller.handlePixTransaction(JSON.stringify(payment), {} as any);

    expect(execute).toHaveBeenCalledWith(payment);
  });

  it('passes object message values unchanged', async () => {
    const payment = { amount: 30 };

    await controller.handlePixTransaction(payment, {} as any);

    expect(execute).toHaveBeenCalledWith(payment);
  });

  it('propagates invalid JSON errors', async () => {
    await expect(controller.handlePixTransaction('{invalid-json', {} as any)).rejects.toThrow(SyntaxError);
  });
});
