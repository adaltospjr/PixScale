import { Controller, Get, Query, HttpCode, HttpStatus, BadRequestException } from '@nestjs/common';
import { ValidateTransactionLimitUseCase } from '../../../application/use-cases/validate-transaction-limit.use-case';

@Controller('limits')
export class LimitsController {
  constructor(
    // 🌟 O NestJS injeta o caso de uso de forma 100% limpa e automática!
    private readonly validateTransactionLimitUseCase: ValidateTransactionLimitUseCase,
  ) {}

  @Get('validate')
  @HttpCode(HttpStatus.OK)
  async validateLimit(
    @Query('account') numberAccount: string,
    @Query('amount') amount: string,
  ) {
    if (!numberAccount || !amount) {
      throw new BadRequestException('Parâmetros account e amount são obrigatórios.');
    }

    const result = await this.validateTransactionLimitUseCase.execute(numberAccount, Number(amount));

    return result;
  }
}
