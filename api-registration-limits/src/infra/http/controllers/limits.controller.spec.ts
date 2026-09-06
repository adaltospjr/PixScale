import { LimitsController } from './limits.controller';

describe('LimitsController', () => {
  it('delegates the validated query to the use case', async () => {
    const useCase = { execute: jest.fn().mockResolvedValue({ allowed: true }) };
    const controller = new LimitsController(useCase as any);

    await expect(controller.validateLimit({ account: '123456-7', amount: 10 } as any)).resolves.toEqual({ allowed: true });
    expect(useCase.execute).toHaveBeenCalledWith('123456-7', 10);
  });
});
