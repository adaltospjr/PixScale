import { Controller, Get, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ValidateTransactionLimitUseCase } from '../../../application/use-cases/validate-transaction-limit.use-case';
import { ValidateLimitDto } from '../dtos/validate-limit.dto';

@Controller('limits')
export class LimitsController {
  constructor(
    // 🌟 O NestJS injeta o caso de uso de forma 100% limpa e automática!
    private readonly validateTransactionLimitUseCase: ValidateTransactionLimitUseCase,
  ) {}

  @Get('validate')
  @HttpCode(HttpStatus.OK)
  validateLimit(@Query() dto: ValidateLimitDto) {
    return this.validateTransactionLimitUseCase.execute(dto.account, dto.amount);
  }
}
