import { IsNotEmpty, IsNumber, IsPositive, IsString, Matches } from 'class-validator';

export class ValidateLimitDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d+-\d$/)
  account_number!: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @IsNotEmpty()
  amount!: number;
}
