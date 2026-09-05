import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsPositive, IsString, Matches } from 'class-validator';

export class ValidateLimitDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d+-\d$/)
  account!: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @IsNotEmpty()
  amount!: number;
}
