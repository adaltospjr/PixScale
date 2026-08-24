import { IsUUID, IsString, IsNotEmpty, IsNumber, IsPositive, Matches } from 'class-validator';

export class CreatePaymentDto {
  @IsUUID('4', { message: 'A chave de idempotência deve ser um UUID v4 válido.' })
  @IsNotEmpty({ message: 'A chave de idempotência é obrigatória.' })
  idempotency_key!: string;

  @IsString({ message: 'O número da conta de destino deve ser um texto.' })
  @IsNotEmpty({ message: 'O número da conta de destino é obrigatório.' })
  // Valida o formato da conta com hífen (ex: 123456-7)
  @Matches(/^\d+-\d$/, { message: 'O formato da conta deve ser numérico com dígito (ex: 123456-7).' })
  destination_account_number!: string;

  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'O valor deve ser um número com até duas casas decimais.' })
  @IsPositive({ message: 'O valor do Pix deve ser maior do que zero.' })
  @IsNotEmpty({ message: 'O valor é obrigatório.' })
  amount!: number;

  @IsString({ message: 'O fingerprint do dispositivo deve ser um texto.' })
  @IsNotEmpty({ message: 'O fingerprint do dispositivo é obrigatório.' })
  device_fingerprint!: string;
}
