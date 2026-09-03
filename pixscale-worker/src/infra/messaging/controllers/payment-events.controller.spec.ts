import { LiquidatePaymentUseCase } from '../../../application/use-cases/liquidate-payment.use-case';
import { PaymentEventsController } from './payment-events.controller';

jest.mock('../../../application/use-cases/liquidate-payment.use-case');

const LiquidatePaymentUseCaseMock = LiquidatePaymentUseCase as jest.MockedClass<typeof LiquidatePaymentUseCase>;

describe('PaymentEventsController', () => {
  let execute: jest.Mock;
  let repository: { executeLiquidation: jest.Mock };
  let controller: PaymentEventsController;

  beforeEach(() => {
    execute = jest.fn().mockResolvedValue(undefined);
    repository = { executeLiquidation: jest.fn() };
    LiquidatePaymentUseCaseMock.mockImplementation(() => ({ execute }) as LiquidatePaymentUseCase);
    controller = new PaymentEventsController(repository as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('ignores messages without a value', async () => {
    await controller.handlePixTransaction(null, {} as any);

    expect(execute).not.toHaveBeenCalled();
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
