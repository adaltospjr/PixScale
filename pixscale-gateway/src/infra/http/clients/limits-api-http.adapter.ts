import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import type { TransactionLimitChecker } from '../../../application/ports/transaction-limit-checker.interface';

@Injectable()
export class LimitsApiHttpAdapter implements TransactionLimitChecker {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  async validate(accountNumber: string, amount: number) {
    const baseUrl =
      this.configService.get<string>('API_REGISTRATION_LIMITS_URL') ||
      'http://localhost:3001';
    const response = await firstValueFrom(
      this.httpService.get(`${baseUrl}/limits/validate`, {
        params: { account: accountNumber, amount },
      }),
    );

    return response.data as { allowed: boolean; reason?: string };
  }
}
